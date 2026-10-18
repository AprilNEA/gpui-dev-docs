import { site, siteRepoUrl } from '~/lib/site'

export function SiteFooter() {
  return (
    <footer className='border-t'>
      <div className='text-fd-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8 text-sm md:flex-row md:justify-between'>
        <p>
          {site.name} is a community project and is not affiliated with Zed Industries. For GPUI itself, see{' '}
          <a href={site.upstream} className='hover:text-fd-foreground underline'>
            gpui.rs
          </a>
          .
        </p>
        <a href={siteRepoUrl} className='hover:text-fd-foreground'>
          Source on GitHub
        </a>
      </div>
    </footer>
  )
}
