import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import type { SearchTag } from '~/components/search-tags'
import { site } from '~/lib/site'
import { publishedProjects, SITE_TAG } from '~/lib/source'
import { Provider } from './provider'
import './global.css'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: 'website' },
}

const searchTags: SearchTag[] = [
  ...publishedProjects.map((project) => ({ value: project.slug, label: project.name })),
  { value: SITE_TAG, label: site.name },
]

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='flex min-h-screen flex-col'>
        <Provider searchTags={searchTags}>{children}</Provider>
      </body>
    </html>
  )
}
