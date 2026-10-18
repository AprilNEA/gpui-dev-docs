import type { Metadata } from 'next'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import { notFound } from 'next/navigation'
import { PageMeta } from '~/components/page-meta'
import { createRelativeCard } from '~/components/relative-card'
import { getPageMarkdownUrl, getPageProject, getPageSourceUrl, source } from '~/lib/source'
import { getMDXComponents } from '~/mdx-components'

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body
  const sourceUrl = getPageSourceUrl(page)
  const markdownUrl = getPageMarkdownUrl(page).url

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className='mb-0'>{page.data.description}</DocsDescription>
      <PageMeta project={getPageProject(page)} platforms={page.data.platforms} since={page.data.since} />
      <div className='flex flex-row items-center gap-2 border-b pb-6'>
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover markdownUrl={markdownUrl} githubUrl={sourceUrl} />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // Links and cards resolve a relative path to a file into that page's URL.
            a: createRelativeLink(source, page),
            Card: createRelativeCard(source, page),
          })}
        />
      </DocsBody>
      <div className='flex'>
        <EditOnGitHub href={sourceUrl} />
      </div>
    </DocsPage>
  )
}

export function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const project = getPageProject(page)
  // Library pages often share titles ("Getting Started"); qualify them with the project.
  const title = project && page.slugs.length > 1 ? `${page.data.title} - ${project.name}` : page.data.title
  return {
    title,
    description: page.data.description,
    alternates: { canonical: page.url },
  }
}
