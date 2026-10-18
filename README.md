# gpui-dev-docs

Source of [GPUI Developers](https://gpui.dev), the documentation site for community libraries built on [GPUI](https://www.gpui.rs).

Each library keeps its guides in its own repository, under `docs/site`. This repository lists the libraries, checks out each library's `docs/site` at a pinned commit, and builds one static [Fumadocs](https://fumadocs.dev) site with one sidebar and one search. API references stay on docs.rs.

## How it works

```text
lib/projects.ts          which libraries the site publishes, and what each tracks
projects.lock.json       the commit each library is built from
        │
        ▼  pnpm sync (scripts/sync-docs.ts)
.repos/<slug>/           shallow, sparse checkout: docs/site, examples, crates/*/examples, top-level files
        │
        ▼  fumadocs-mdx workspaces (source.config.ts, project.source.config.ts)
/docs/<slug>/...         one sidebar root per library, tagged search, llms.txt
        │
        ▼  next build (static export)
out/                     served by Cloudflare Workers static assets (wrangler.jsonc)
```

- Content owned by this repository lives in `content/docs`: the overview and the contributor guide.
- Library pages are validated against one shared schema (`lib/frontmatter.ts`) and render with one shared component set (`mdx-components.tsx`).
- `pnpm sync` also generates `lib/collections.generated.ts` and `public/_redirects` (short links such as `gpui.dev/updater`). Both are ignored by Git.

## Develop

Requires Node.js 24 and pnpm. With [devenv](https://devenv.sh), `devenv shell` provides both.

```bash
pnpm install
pnpm dev                              # sync pinned revisions, then start Next.js on :3000
pnpm sync updater=../gpui-updater     # build one library from a local working copy
pnpm sync --reset                     # back to the pinned revisions
pnpm sync --update [slug ...]         # move pins forward and rewrite projects.lock.json
```

Before opening a pull request:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm build
```

`pnpm preview` serves `out/` with Wrangler, including `_redirects` and `_headers`, the way Cloudflare will.

## Add a library

See [Publishing docs](https://gpui.dev/docs/contributing) (`content/docs/contributing/index.mdx`): add `docs/site` to the library repository, then register it in `lib/projects.ts`.

## Deploy

The site is an assets-only Cloudflare Worker named `gpui-dev-docs`.

```bash
pnpm build
pnpm exec wrangler deploy
```

Domains:

- `gpui.dev` is the canonical domain; `lib/site.ts` uses it for canonical URLs and the sitemap. Bind it to the Worker as a custom domain.
- `gpui.org` should permanently redirect to `gpui.dev`, preserving path and query, with a Cloudflare Redirect Rule on the `gpui.org` zone. Do not serve the site on both domains.

Not configured yet: a deploy workflow. The intended design is one GitHub Actions workflow that runs on pushes to `main` (building the committed pins), on a daily schedule and on a `repository_dispatch` sent by library repositories (running `pnpm sync --update` first), then deploys with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` and commits the updated `projects.lock.json`.
