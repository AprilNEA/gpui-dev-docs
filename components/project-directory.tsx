import type { Project, ProjectCategory } from '~/lib/projects'
import { icons } from 'lucide-react'
import Link from 'next/link'
import { categories, projects } from '~/lib/projects'
import { publishedProjects } from '~/lib/source'
import { cn } from '~/lib/utils'

const published = new Set(publishedProjects.map((project) => project.slug))

function primaryLink(project: Project): { href: string; label: string; external: boolean } {
  if (published.has(project.slug)) return { href: `/docs/${project.slug}`, label: 'Docs', external: false }
  if (project.homepage) return { href: project.homepage, label: 'Docs', external: true }
  return { href: `https://github.com/${project.repo}#readme`, label: 'README', external: true }
}

function ProjectCard({ project }: { project: Project }) {
  const Icon = icons[project.icon as keyof typeof icons] ?? icons.Box
  const primary = primaryLink(project)
  const links = [
    primary,
    { href: `https://github.com/${project.repo}`, label: 'GitHub', external: true },
    ...(project.crates[0] ? [{ href: `https://docs.rs/${project.crates[0]}`, label: 'API', external: true }] : []),
  ]

  return (
    <div className='bg-fd-card text-fd-card-foreground flex flex-col rounded-xl border p-4'>
      <div className='flex items-center gap-2'>
        <span className='bg-fd-muted text-fd-muted-foreground flex size-8 items-center justify-center rounded-md border'>
          <Icon className='size-4' aria-hidden />
        </span>
        <Link
          href={primary.href}
          className='font-medium hover:underline'
          {...(primary.external ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {project.name}
        </Link>
        {!published.has(project.slug) && !project.homepage && (
          <span className='text-fd-muted-foreground ml-auto rounded-full border px-2 py-0.5 text-xs'>Docs soon</span>
        )}
      </div>
      <p className='text-fd-muted-foreground mt-3 flex-1 text-sm'>{project.description}</p>
      <div className='mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm'>
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className='text-fd-muted-foreground hover:text-fd-foreground'
            {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

/** Every registered project, grouped by category in registry order. */
export function ProjectDirectory({ className }: { className?: string }) {
  const groups = (Object.keys(categories) as ProjectCategory[])
    .map((category) => ({ category, members: projects.filter((project) => project.category === category) }))
    .filter(({ members }) => members.length > 0)

  return (
    <div className={cn('not-prose flex flex-col gap-10', className)}>
      {groups.map(({ category, members }) => (
        <section key={category}>
          <h2 className='text-fd-muted-foreground mb-3 text-sm font-medium'>{categories[category]}</h2>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {members.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
