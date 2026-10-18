import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { site, siteRepoUrl } from './site'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className='font-semibold tracking-tight'>
          GPUI <span className='text-fd-muted-foreground'>Developers</span>
        </span>
      ),
      url: '/',
    },
    githubUrl: siteRepoUrl,
    links: [
      // The docs sidebar already is the docs navigation; show this link on the home navbar only.
      { text: 'Docs', url: '/docs', active: 'nested-url', on: 'nav' },
      { text: 'GPUI', url: site.upstream, external: true },
    ],
  }
}
