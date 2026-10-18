# gpui-dev-docs

Fumadocs site for GPUI Developers (gpui.dev). It aggregates `docs/site` from GPUI ecosystem library repositories into one static Next.js export served by Cloudflare Workers static assets.

## Layout

| Path                                           | Purpose                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `app/`                                         | Next.js routes: home, `/docs`, static search index, llms.txt, per-page Markdown, sitemap, robots |
| `components/`                                  | Site components: search dialog with project filter, project directory, page metadata             |
| `content/docs/`                                | Pages owned by this repository: overview and contributor guide                                   |
| `lib/projects.ts`                              | Project registry; the only list of libraries the site knows about                                |
| `lib/frontmatter.ts`                           | Frontmatter and meta schemas shared by the site and every library                                |
| `lib/source.ts`                                | Fumadocs loader that mounts each library under `/docs/<slug>`                                    |
| `scripts/sync-docs.ts`                         | Checks out library docs into `.repos/` and generates derived files                               |
| `source.config.ts`, `project.source.config.ts` | fumadocs-mdx config for site content and for each library workspace                              |
| `projects.lock.json`                           | Pinned commit per library; written by `pnpm sync`                                                |

## Commands

```bash
pnpm dev | pnpm build | pnpm typecheck | pnpm lint | pnpm format:check
pnpm sync [--update|--reset] [slug ...] | pnpm sync <slug>=<path>
```

`dev`, `build`, and `typecheck` run `pnpm sync` first. `next build` needs network access in sandboxed environments.

## Invariants

- Never edit generated files: `lib/collections.generated.ts`, `public/_redirects`, `.source/`, `.repos/`.
- Only `docs/site`, `examples`, `crates/*/examples`, and top-level files of a library are ever checked out. Do not widen `PROJECT_DOCS_DIR` or `PROJECT_INCLUDE_DIRS` without a reason; private docs live elsewhere in those repositories.
- Library pages render with the shared component set in `mdx-components.tsx`; keep the component table in `content/docs/contributing/writing.mdx` in sync with it.
- Changing a project's `slug` changes its URLs. Treat slugs as permanent.
- The site is a static export: no middleware, rewrites, server redirects, or ISR. Put redirects and headers in `public/_redirects` (generated) and `public/_headers`.
- Local copies (`pnpm sync <slug>=<path>`) never change `projects.lock.json`; only `--update` and newly registered projects do.
