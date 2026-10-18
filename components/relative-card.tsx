import type { LoaderConfig, LoaderOutput, Page } from 'fumadocs-core/source'
import type { CardProps } from 'fumadocs-ui/components/card'
import { Card } from 'fumadocs-ui/components/card'

/**
 * `<Card>` that resolves a relative file path in `href` the way Markdown links do,
 * so library pages can write `<Card href='./guide.mdx' />` without knowing the site's URLs.
 */
export function createRelativeCard<C extends LoaderConfig>(source: LoaderOutput<C>, page: Page | C['page']) {
  return function RelativeCard({ href, ...props }: CardProps) {
    return <Card href={href ? source.resolveHref(href, page) : href} {...props} />
  }
}
