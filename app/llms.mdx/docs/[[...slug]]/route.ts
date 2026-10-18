import { notFound } from 'next/navigation'
import { getLLMText, getPageMarkdownUrl, source } from '~/lib/source'

export const revalidate = false

export async function GET(_request: Request, { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>) {
  const { slug = [] } = await params
  // URLs end in content.md so that every page, including /docs itself, maps to a file.
  if (slug.at(-1) !== 'content.md') notFound()
  const page = source.getPage(slug.slice(0, -1))
  if (!page) notFound()

  return new Response(await getLLMText(page), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({ slug: getPageMarkdownUrl(page).segments }))
}
