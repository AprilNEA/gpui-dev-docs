import type { NextConfig } from 'next'
import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

// The site is a static export served by Cloudflare Workers static assets.
// Rewrites, redirects, headers, middleware, and ISR are unavailable; put
// redirects and headers in public/_redirects and public/_headers instead.
const config: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
}

export default withMDX(config)
