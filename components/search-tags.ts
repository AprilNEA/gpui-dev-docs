'use client'

import { createContext } from 'react'

export interface SearchTag {
  value: string
  label: string
}

/** Filter options for the search dialog, provided by the root layout. */
export const SearchTagsContext = createContext<SearchTag[]>([])
