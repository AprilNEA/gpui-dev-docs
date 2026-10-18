/**
 * Materialize each registered project's public docs under .repos/<slug>, then
 * generate the files the site derives from them.
 *
 *   pnpm sync                        check out the revisions pinned in projects.lock.json
 *   pnpm sync --update [slug ...]    re-resolve tracked refs (all, or the listed projects) and rewrite the lock
 *   pnpm sync <slug>=<path> [...]    preview a local working copy; later runs refresh it until --reset
 *   pnpm sync --reset [slug ...]     drop local copies (all, or the listed projects) and return to the pins
 *
 * Only PROJECT_DOCS_DIR, PROJECT_INCLUDE_DIRS, and top-level files are checked out
 * (shallow, blobless, sparse), so internal docs such as docs/design never reach the site.
 */
import type { DocsTrack, Project } from '../lib/projects.ts'
import { execFile } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { assertRegistry, PROJECT_DOCS_DIR, PROJECT_INCLUDE_DIRS, projects } from '../lib/projects.ts'

interface Pin {
  track: string
  ref: string
  sha: string
}
type Lock = Record<string, Pin>
type Status = 'cached' | 'fetched' | 'local' | 'no docs'
type DocsProject = Project & { docs: NonNullable<Project['docs']> }

const root = resolve(import.meta.dirname, '..')
const reposDir = join(root, '.repos')
const lockPath = join(root, 'projects.lock.json')
const collectionsPath = join(root, 'lib', 'collections.generated.ts')
const redirectsPath = join(root, 'public', '_redirects')
/** Written into a local copy; records the working copy it came from. */
const LOCAL_MARKER = '.gpui-dev-local'

const run = promisify(execFile)

async function git(args: string[], cwd?: string): Promise<string> {
  const { stdout } = await run('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  })
  return stdout.trim()
}

function remoteUrl(project: Project): string {
  return `https://github.com/${project.repo}.git`
}

function describeTrack(track: DocsTrack): string {
  return track.type === 'release' ? `release:${track.tagPrefix}` : 'default-branch'
}

function parseArgs(argv: string[]) {
  const options = { update: false, reset: false, slugs: new Set<string>(), local: new Map<string, string>() }
  const base = process.env.INIT_CWD ?? process.cwd()
  for (const arg of argv) {
    if (arg === '--update') {
      options.update = true
    } else if (arg === '--reset') {
      options.reset = true
    } else if (arg.startsWith('-')) {
      throw new Error(`unknown option ${arg}`)
    } else if (arg.includes('=')) {
      const index = arg.indexOf('=')
      options.local.set(arg.slice(0, index), resolve(base, arg.slice(index + 1)))
    } else {
      options.slugs.add(arg)
    }
  }
  if (options.update && options.reset) throw new Error('--update and --reset cannot be combined')
  if (options.slugs.size > 0 && !options.update && !options.reset)
    throw new Error('project names are only accepted after --update or --reset')
  for (const slug of [...options.slugs, ...options.local.keys()]) {
    const project = projects.find((candidate) => candidate.slug === slug)
    if (!project) throw new Error(`unknown project "${slug}"`)
    if (!project.docs) throw new Error(`project "${slug}" does not publish docs on this site`)
  }
  return options
}

function readLock(): Lock {
  return existsSync(lockPath) ? (JSON.parse(readFileSync(lockPath, 'utf8')) as Lock) : {}
}

function writeIfChanged(path: string, content: string): boolean {
  if (existsSync(path) && readFileSync(path, 'utf8') === content) return false
  writeFileSync(path, content)
  return true
}

function compareVersions(a: number[], b: number[]): number {
  for (let index = 0; index < 3; index++) {
    if (a[index] !== b[index]) return a[index] - b[index]
  }
  return 0
}

async function resolvePin(project: Project, track: DocsTrack): Promise<Pin> {
  const url = remoteUrl(project)
  if (track.type === 'default-branch') {
    const output = await git(['ls-remote', '--symref', url, 'HEAD'])
    const ref = /^ref: refs\/heads\/(\S+)\tHEAD$/m.exec(output)?.[1]
    const sha = /^([0-9a-f]{40})\tHEAD$/m.exec(output)?.[1]
    if (!ref || !sha) throw new Error(`${project.slug}: cannot resolve the default branch of ${project.repo}`)
    return { track: describeTrack(track), ref, sha }
  }

  const output = await git(['ls-remote', '--tags', url, `refs/tags/${track.tagPrefix}*`])
  const commits = new Map<string, string>()
  for (const line of output.split('\n')) {
    const [sha, name] = line.split('\t')
    if (!sha || !name) continue
    const tag = name.slice('refs/tags/'.length)
    // Annotated tags list the tag object first and the peeled commit (`^{}`) second.
    if (tag.endsWith('^{}')) commits.set(tag.slice(0, -3), sha)
    else if (!commits.has(tag)) commits.set(tag, sha)
  }
  let newest: { tag: string; sha: string; version: number[] } | undefined
  for (const [tag, sha] of commits) {
    // Prereleases and tags with other shapes are never published.
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(tag.slice(track.tagPrefix.length))
    if (!match) continue
    const version = match.slice(1).map(Number)
    if (!newest || compareVersions(version, newest.version) > 0) newest = { tag, sha, version }
  }
  if (!newest) throw new Error(`${project.slug}: ${project.repo} has no release tag matching ${track.tagPrefix}X.Y.Z`)
  return { track: describeTrack(track), ref: newest.tag, sha: newest.sha }
}

async function checkout(project: Project, pin: Pin): Promise<'cached' | 'fetched'> {
  const dest = join(reposDir, project.slug)
  // Non-cone patterns, because cone mode cannot express `crates/*/examples`:
  // top-level files, but no top-level directory except the listed ones.
  const patterns = ['/*', '!/*/', ...[PROJECT_DOCS_DIR, ...PROJECT_INCLUDE_DIRS].map((dir) => `/${dir}/`)]
  if (existsSync(join(dest, '.git')) && !existsSync(join(dest, LOCAL_MARKER))) {
    const head = await git(['rev-parse', 'HEAD'], dest).catch(() => '')
    const sparse = await git(['sparse-checkout', 'list'], dest).catch(() => '')
    if (head === pin.sha && sparse === patterns.join('\n')) return 'cached'
  }
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(dest, { recursive: true })
  await git(['init', '--quiet'], dest)
  await git(['remote', 'add', 'origin', remoteUrl(project)], dest)
  await git(['sparse-checkout', 'set', '--no-cone', ...patterns], dest)
  await git(['fetch', '--quiet', '--depth=1', '--filter=blob:none', 'origin', pin.sha], dest)
  await git(['checkout', '--quiet', '--detach', 'FETCH_HEAD'], dest)
  return 'fetched'
}

/** Directories under `root` matching `pattern`, where a `*` segment matches any one directory. */
function expandDir(root: string, pattern: string): string[] {
  let matches = ['']
  for (const segment of pattern.split('/')) {
    matches = matches.flatMap((prefix) => {
      if (segment !== '*') return [join(prefix, segment)]
      const dir = join(root, prefix)
      if (!existsSync(dir)) return []
      return readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(prefix, entry.name))
    })
  }
  return matches.filter((dir) => existsSync(join(root, dir)))
}

function copyLocal(project: Project, source: string): void {
  if (!existsSync(join(source, PROJECT_DOCS_DIR)))
    throw new Error(`${project.slug}: ${source} has no ${PROJECT_DOCS_DIR}`)
  const dest = join(reposDir, project.slug)
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(dest, { recursive: true })
  // Copy rather than symlink: Turbopack does not follow symlinks out of the project root.
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (entry.isFile()) cpSync(join(source, entry.name), join(dest, entry.name))
  }
  for (const dir of [PROJECT_DOCS_DIR, ...PROJECT_INCLUDE_DIRS].flatMap((pattern) => expandDir(source, pattern))) {
    cpSync(join(source, dir), join(dest, dir), { recursive: true })
  }
  writeFileSync(join(dest, LOCAL_MARKER), `${source}\n`)
}

function writeCollections(published: Project[], local: Project[]): void {
  const lines = [
    '// Generated by scripts/sync-docs.ts from the synced repositories. Do not edit.',
    "import type { docs as site } from 'fumadocs-mdx:collections/server'",
    ...published.map(
      (project, index) => `import { docs as project${index} } from 'fumadocs-mdx:collections/${project.slug}/server'`,
    ),
    '',
    'export const projectCollections: Record<string, typeof site> = {',
    ...published.map((project, index) => `  '${project.slug}': project${index},`),
    '}',
    '',
    '/** Projects built from a local working copy instead of their pinned revision. */',
    `export const localProjects: string[] = [${local.map((project) => `'${project.slug}'`).join(', ')}]`,
    '',
  ]
  writeIfChanged(collectionsPath, lines.join('\n'))
}

function writeRedirects(published: Project[]): void {
  // Exact rules first: Cloudflare matches them faster than rules with splats.
  const lines = [
    '# Generated by scripts/sync-docs.ts: short links such as gpui.dev/updater.',
    ...published.map((project) => `/${project.slug} /docs/${project.slug} 301`),
    ...published.map((project) => `/${project.slug}/* /docs/${project.slug}/:splat 301`),
    '',
  ]
  mkdirSync(join(root, 'public'), { recursive: true })
  writeIfChanged(redirectsPath, lines.join('\n'))
}

async function assertIcons(): Promise<void> {
  const { icons } = await import('lucide-react')
  const unknown = projects.filter((project) => !(project.icon in icons))
  if (unknown.length > 0)
    throw new Error(`unknown Lucide icon: ${unknown.map((project) => `${project.slug} (${project.icon})`).join(', ')}`)
}

async function main(): Promise<void> {
  assertRegistry()
  await assertIcons()
  const options = parseArgs(process.argv.slice(2))
  const lock = readLock()
  const managed = projects.filter((project): project is DocsProject => Boolean(project.docs))

  mkdirSync(reposDir, { recursive: true })
  for (const entry of readdirSync(reposDir)) {
    if (!managed.some((project) => project.slug === entry))
      rmSync(join(reposDir, entry), { recursive: true, force: true })
  }

  const results = await Promise.all(
    managed.map(async (project) => {
      const dest = join(reposDir, project.slug)
      const marker = join(dest, LOCAL_MARKER)
      const selected = options.slugs.size === 0 || options.slugs.has(project.slug)
      if (options.reset && selected) rmSync(marker, { force: true })
      const localSource =
        options.local.get(project.slug) ?? (existsSync(marker) ? readFileSync(marker, 'utf8').trim() : undefined)

      let pin = lock[project.slug]
      if (!pin || pin.track !== describeTrack(project.docs.track) || (options.update && selected)) {
        pin = await resolvePin(project, project.docs.track)
      }

      let status: Status
      if (localSource) {
        copyLocal(project, localSource)
        status = 'local'
      } else {
        status = await checkout(project, pin)
      }
      if (!existsSync(join(dest, PROJECT_DOCS_DIR))) status = 'no docs'
      return { project, pin, status, localSource }
    }),
  )

  const nextLock: Lock = Object.fromEntries(results.map(({ project, pin }) => [project.slug, pin]))
  const lockChanged = writeIfChanged(lockPath, `${JSON.stringify(nextLock, null, 2)}\n`)
  const published = results.filter(({ status }) => status !== 'no docs').map(({ project }) => project)
  const local = results.filter(({ status }) => status === 'local').map(({ project }) => project)
  writeCollections(published, local)
  writeRedirects(published)

  const width = Math.max(...results.map(({ project }) => project.slug.length))
  for (const { project, pin, status, localSource } of results) {
    const revision = status === 'local' ? (localSource ?? '') : `${pin.ref}@${pin.sha.slice(0, 7)}`
    console.log(`${project.slug.padEnd(width)}  ${status.padEnd(7)}  ${revision}`)
  }
  if (lockChanged) console.log(`updated ${lockPath}`)
  if (results.some(({ status }) => status === 'local'))
    console.log('local copies are in use; run `pnpm sync --reset` to return to the pinned revisions')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
