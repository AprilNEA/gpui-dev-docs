import type { InferPageType } from 'fumadocs-core/source'
import type { Project } from './projects'
import { createGetUrl, llms, loader } from 'fumadocs-core/source'
import { lucideIconsPlugin } from 'fumadocs-core/source/plugins/lucide-icons'
import { docs } from 'fumadocs-mdx:collections/server'
import lock from '../projects.lock.json'
import { localProjects, projectCollections } from './collections.generated'
import { getProject, PROJECT_DOCS_DIR, projects } from './projects'
import { site, siteRepoUrl } from './site'

type FumadocsSource = ReturnType<typeof docs.toFumadocsSource>
interface Pin {
  ref: string
  sha: string
}

/** Search tag for pages owned by this repository rather than by a library. */
export const SITE_TAG = 'site'

/** Projects whose repositories were synced with docs; in registry order. */
export const publishedProjects: Project[] = projects.filter((project) => project.slug in projectCollections)

// Mount a library's docs under /docs/<slug> as a sidebar root folder. The library's
// meta.json orders its pages; the registry owns the folder's title, description, and icon.
function mountProject(project: Project, collection: typeof docs): FumadocsSource {
  const source = collection.toFumadocsSource({ baseDir: project.slug })
  const metaPath = `${project.slug}/meta.json`
  const identity = { title: project.name, description: project.description, icon: project.icon, root: true }
  const files = source.files.map((file) =>
    file.type === 'meta' && file.path === metaPath ? { ...file, data: { ...file.data, ...identity } } : file,
  )
  if (!files.some((file) => file.path === metaPath)) {
    files.push({ type: 'meta', path: metaPath, data: identity } as never)
  }
  return { ...source, files }
}

export const source = loader(
  {
    [SITE_TAG]: docs.toFumadocsSource(),
    ...Object.fromEntries(
      publishedProjects.map((project) => [project.slug, mountProject(project, projectCollections[project.slug])]),
    ),
  },
  {
    baseUrl: '/docs',
    plugins: [lucideIconsPlugin()],
  },
)

export type Page = InferPageType<typeof source>

export function getPageProject(page: Page): Project | undefined {
  const slug = page.slugs[0]
  return slug !== undefined && slug in projectCollections ? getProject(slug) : undefined
}

/** True when the project was built from a local working copy (`pnpm sync <slug>=<path>`). */
export function isLocalPreview(project: Project): boolean {
  return localProjects.includes(project.slug)
}

/** The revision a project's pages were built from, as recorded by `pnpm sync`; none for local copies. */
export function getProjectPin(project: Project): Pin | undefined {
  if (isLocalPreview(project)) return undefined
  return (lock as Record<string, Pin | undefined>)[project.slug]
}

/** Where the page's source lives on GitHub; edits always target the default branch. */
export function getPageSourceUrl(page: Page): string {
  const project = getPageProject(page)
  if (!project) return `${siteRepoUrl}/blob/${site.branch}/content/docs/${page.path}`
  const relative = page.path.slice(project.slug.length + 1)
  return `https://github.com/${project.repo}/blob/HEAD/${PROJECT_DOCS_DIR}/${relative}`
}

const getMarkdownUrl = createGetUrl('/llms.mdx/docs')

/** Each page is also exported as Markdown at /llms.mdx/docs/<slug>/content.md. */
export function getPageMarkdownUrl(page: Page): { segments: string[]; url: string } {
  const segments = [...page.slugs, 'content.md']
  return { segments, url: getMarkdownUrl(segments) }
}

export async function getLLMText(page: Page): Promise<string> {
  const processed = await page.data.getText('processed')
  return `# ${page.data.title} (${page.url})\n\n${processed}`
}

export const docsLlms = llms(source, { renderPage: getLLMText })
