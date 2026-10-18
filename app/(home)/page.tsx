import Link from 'next/link'
import { ProjectDirectory } from '~/components/project-directory'
import { site } from '~/lib/site'

export default function HomePage() {
  return (
    <main className='mx-auto w-full max-w-6xl flex-1 px-6 py-16 md:py-24'>
      <section className='max-w-3xl'>
        <p className='text-fd-muted-foreground text-sm font-medium'>Community ecosystem</p>
        <h1 className='mt-3 text-4xl font-semibold tracking-tight text-balance md:text-5xl'>
          Libraries for building desktop apps with GPUI
        </h1>
        <p className='text-fd-muted-foreground mt-5 text-lg'>
          Guides for community libraries built on GPUI, the GPU-accelerated UI framework behind the Zed editor. Each
          library keeps its guides next to its code; GPUI Developers publishes them in one place, with one search.
        </p>
        <div className='mt-8 flex flex-wrap gap-3'>
          <Link
            href='/docs'
            className='bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 rounded-lg px-4 py-2 text-sm font-medium'
          >
            Browse the docs
          </Link>
          <a
            href={site.upstream}
            target='_blank'
            rel='noreferrer'
            className='hover:bg-fd-accent rounded-lg border px-4 py-2 text-sm font-medium'
          >
            GPUI on gpui.rs
          </a>
        </div>
      </section>
      <ProjectDirectory className='mt-16' />
    </main>
  )
}
