/**
 * Project registry: the single source of truth for what GPUI Developers aggregates.
 *
 * Next.js, source.config.ts, and Node (scripts/sync-docs.ts) all import this file,
 * so keep it free of runtime dependencies and of TypeScript syntax that Node cannot strip.
 */

/** Directory inside each library repository whose contents are published under /docs/<slug>. */
export const PROJECT_DOCS_DIR = 'docs/site'

/**
 * Directories, besides PROJECT_DOCS_DIR, that pages may pull code from with <include>.
 * A `*` matches one path segment, so Cargo workspaces can embed each member crate's examples.
 */
export const PROJECT_INCLUDE_DIRS = ['examples', 'crates/*/examples']

export type ProjectCategory = 'foundation' | 'ui' | 'data' | 'tooling' | 'distribution' | 'ai'

export type DocsTrack =
  /** Publish the tip of the repository's default branch. */
  | { type: 'default-branch' }
  /** Publish the newest non-prerelease tag `<tagPrefix><semver>`, such as `v0.2.0`. */
  | { type: 'release'; tagPrefix: string }

export interface Project {
  /** URL segment: /docs/<slug>. Lowercase letters, digits, and hyphens. */
  slug: string
  name: string
  description: string
  /** GitHub `owner/name`. */
  repo: string
  category: ProjectCategory
  /** Crates published on crates.io; the first is the primary crate. */
  crates: string[]
  /** Lucide icon name, shown in the sidebar and on the home page. */
  icon: string
  /** Pull the repository's PROJECT_DOCS_DIR into this site. */
  docs?: { track: DocsTrack }
  /** Documentation hosted elsewhere, for projects that do not publish here. */
  homepage?: string
}

export const categories: Record<ProjectCategory, string> = {
  foundation: 'Foundation',
  ui: 'UI and Design',
  data: 'Data and State',
  tooling: 'Testing and Tooling',
  distribution: 'Distribution',
  ai: 'AI Tooling',
}

// Tags in several repositories lag crates.io (gpui-symbols is tagged v0.5.3 but
// published 0.6.1), so every project follows its default branch until its tags
// are reliable. Switch a project to { type: 'release', tagPrefix: 'v' } then.
const branch = { track: { type: 'default-branch' } } satisfies Project['docs']

export const projects: Project[] = [
  {
    slug: 'alloy',
    name: 'gpui-alloy',
    description: 'A maintained GPUI source distribution with tracked downstream patches.',
    repo: 'AprilNEA/gpui-alloy',
    category: 'foundation',
    crates: [],
    icon: 'Layers',
    docs: branch,
  },
  {
    slug: 'tokio-bridge',
    name: 'gpui-tokio-bridge',
    description: 'Run Tokio async tasks within a GPUI context.',
    repo: 'AprilNEA/gpui-tokio-bridge',
    category: 'foundation',
    crates: ['gpui-tokio-bridge'],
    icon: 'Cable',
    docs: branch,
  },
  {
    slug: 'cupertino',
    name: 'gpui-cupertino',
    description: 'Apple-inspired components, materials, and motion for GPUI.',
    repo: 'AprilNEA/gpui-cupertino',
    category: 'ui',
    crates: [],
    icon: 'AppWindowMac',
    docs: branch,
  },
  {
    slug: 'symbols',
    name: 'gpui-symbols',
    description: 'Native SF Symbols for GPUI with a type-safe Icon component.',
    repo: 'AprilNEA/gpui-symbols',
    category: 'ui',
    crates: ['gpui-symbols'],
    icon: 'Shapes',
    docs: branch,
  },
  {
    slug: 'motion',
    name: 'gpui-motion',
    description: 'State-driven spring and tween animations with velocity-preserving retargeting.',
    repo: 'AprilNEA/gpui-motion',
    category: 'ui',
    crates: ['gpui-motion'],
    icon: 'Spline',
    docs: branch,
  },
  {
    slug: 'query',
    name: 'gpui-query',
    description: 'TanStack Query-inspired async state management for GPUI.',
    repo: 'AprilNEA/gpui-query',
    category: 'data',
    crates: ['gpui-query'],
    icon: 'DatabaseZap',
    homepage: 'https://gpui-query.freeoxide.com',
  },
  {
    slug: 'shot',
    name: 'gpui-shot',
    description: 'Screenshot and visual snapshot testing for GPUI applications.',
    repo: 'AprilNEA/gpui-shot',
    category: 'tooling',
    crates: ['gpui-shot'],
    icon: 'Camera',
    docs: branch,
  },
  {
    slug: 'updater',
    name: 'gpui-updater',
    description: 'Self-update for GPUI desktop apps, with GitHub Releases, static manifests, and Sparkle.',
    repo: 'AprilNEA/gpui-updater',
    category: 'distribution',
    crates: ['gpui-updater', 'gpui-updater-core', 'gpui-updater-pre', 'gpui-updater-sparkle'],
    icon: 'RefreshCw',
    docs: branch,
  },
  {
    slug: 'skills',
    name: 'gpui-skills',
    description: 'AI agent skills for building desktop applications with GPUI.',
    repo: 'AprilNEA/gpui-skills',
    category: 'ai',
    crates: [],
    icon: 'Sparkles',
    docs: branch,
  },
]

/** Top-level folders of content/docs; a project slug must not shadow them. */
const RESERVED_SLUGS = new Set(['contributing'])

export function assertRegistry(list: readonly Project[] = projects): void {
  const seen = new Set<string>()
  for (const project of list) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) throw new Error(`invalid project slug "${project.slug}"`)
    if (RESERVED_SLUGS.has(project.slug)) throw new Error(`project slug "${project.slug}" is reserved`)
    if (seen.has(project.slug)) throw new Error(`duplicate project slug "${project.slug}"`)
    if (!/^[\w.-]+\/[\w.-]+$/.test(project.repo)) throw new Error(`${project.slug}: invalid repo "${project.repo}"`)
    seen.add(project.slug)
  }
}

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}
