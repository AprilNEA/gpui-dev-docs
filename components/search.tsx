'use client'

import type { SharedProps } from 'fumadocs-ui/components/dialog/search'
import { useStaticSearch } from 'fumadocs-core/search/client'
import {
  SearchDialog as Dialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  TagsList,
  TagsListItem,
} from 'fumadocs-ui/components/dialog/search'
import { usePathname } from 'next/navigation'
import { use, useState } from 'react'
import { SearchTagsContext } from './search-tags'

export function SearchDialog(props: SharedProps) {
  const tags = use(SearchTagsContext)
  const pathname = usePathname()
  // Default to the project being read; a choice made in the dialog lasts until the page changes.
  const current = tags.find(({ value }) => pathname === `/docs/${value}` || pathname.startsWith(`/docs/${value}/`))
  const [choice, setChoice] = useState<{ pathname: string; tag: string | undefined }>()
  const tag = choice?.pathname === pathname ? choice.tag : current?.value
  const search = useStaticSearch({ tag })

  return (
    <Dialog {...search} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList />
        {tags.length > 1 && (
          <SearchDialogFooter className='flex flex-row flex-wrap items-center gap-2'>
            <TagsList tag={tag} onTagChange={(value) => setChoice({ pathname, tag: value })} allowClear>
              {tags.map(({ value, label }) => (
                <TagsListItem key={value} value={value}>
                  {label}
                </TagsListItem>
              ))}
            </TagsList>
          </SearchDialogFooter>
        )}
      </SearchDialogContent>
    </Dialog>
  )
}
