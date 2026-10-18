import { metaSchema as baseMetaSchema, pageSchema as basePageSchema } from 'fumadocs-core/source/schema'
import { z } from 'zod'

export const platforms = ['macos', 'linux', 'windows', 'web'] as const
export type Platform = (typeof platforms)[number]

/**
 * Frontmatter accepted by every page, in this repository and in library repositories.
 * The build fails on unknown platforms, so typos surface in the library's preview build.
 */
export const pageSchema = basePageSchema.extend({
  /** Platforms the page applies to; omit when it applies to all of them. */
  platforms: z.array(z.enum(platforms)).optional(),
  /** First crate version that supports the feature, such as `0.2.0`. */
  since: z.string().optional(),
})

export const metaSchema = baseMetaSchema
