import { createFromSource } from 'fumadocs-core/search/server'
import { getPageProject, SITE_TAG, source } from '~/lib/source'

// Exported as a static JSON index at /api/search; the dialog filters it by project tag.
export const revalidate = false

export const { staticGET: GET } = createFromSource(source, {
  buildIndex(page) {
    return {
      id: page.url,
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      structuredData: page.data.structuredData,
      tag: getPageProject(page)?.slug ?? SITE_TAG,
    }
  },
})
