import { existsSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { defineConfig, defineDocs } from 'fumadocs-mdx/config'
import { metaSchema, pageSchema } from './lib/frontmatter.ts'
import { PROJECT_DOCS_DIR, projects } from './lib/projects.ts'
import * as projectConfig from './project.source.config.ts'

// Pages owned by this repository: the overview and the contributor guide.
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: { schema: metaSchema },
})

// One workspace per library repository that `pnpm sync` checked out with docs.
// A project whose repository has no docs/site yet is simply left out.
const workspaces = Object.fromEntries(
  projects
    .filter((project) => project.docs && existsSync(join(process.cwd(), '.repos', project.slug, PROJECT_DOCS_DIR)))
    .map((project) => [project.slug, { dir: join('.repos', project.slug), config: projectConfig }]),
)

export default defineConfig({
  workspaces,
})
