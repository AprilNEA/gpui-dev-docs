'use client'

import type { ReactNode } from 'react'
import type { SearchTag } from '~/components/search-tags'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { SearchDialog } from '~/components/search'
import { SearchTagsContext } from '~/components/search-tags'

export function Provider({ children, searchTags }: { children: ReactNode; searchTags: SearchTag[] }) {
  return (
    <SearchTagsContext value={searchTags}>
      <RootProvider search={{ SearchDialog }}>{children}</RootProvider>
    </SearchTagsContext>
  )
}
