import { defineConfig, defineDocs } from 'fumadocs-mdx/config'
import { metaSchema, pageSchema } from './lib/frontmatter.ts'
import { PROJECT_DOCS_DIR } from './lib/projects.ts'

// Shared by every library workspace (see source.config.ts). Paths are relative
// to the library repository root, so <include> can reach ../../examples.
export const docs = defineDocs({
  dir: PROJECT_DOCS_DIR,
  docs: {
    schema: pageSchema,
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: { schema: metaSchema },
})

export default defineConfig()
