import type { ReactNode } from 'react'
import type { Platform } from '~/lib/frontmatter'
import type { Project } from '~/lib/projects'
import { getProjectPin, isLocalPreview } from '~/lib/source'

const platformLabels: Record<Platform, string> = {
  macos: 'macOS',
  linux: 'Linux',
  windows: 'Windows',
  web: 'Web',
}

function Pill({ children, href }: { children: ReactNode; href?: string }) {
  const className = 'rounded-full border px-2.5 py-0.5 text-xs text-fd-muted-foreground'
  return href ? (
    <a href={href} target='_blank' rel='noreferrer' className={`${className} hover:text-fd-foreground`}>
      {children}
    </a>
  ) : (
    <span className={className}>{children}</span>
  )
}

/** Facts about the page: which crate it documents, where it applies, and which revision it was built from. */
export function PageMeta({ project, platforms, since }: { project?: Project; platforms?: Platform[]; since?: string }) {
  const pin = project ? getProjectPin(project) : undefined
  if (!project && !platforms?.length && !since) return null

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {project?.crates[0] && <Pill href={`https://docs.rs/${project.crates[0]}`}>{project.crates[0]} API</Pill>}
      {platforms?.map((platform) => (
        <Pill key={platform}>{platformLabels[platform]}</Pill>
      ))}
      {since && <Pill>Since {since}</Pill>}
      {project && isLocalPreview(project) && <Pill>Local preview</Pill>}
      {project && pin && (
        <Pill href={`https://github.com/${project.repo}/tree/${pin.sha}`}>
          {pin.ref}@{pin.sha.slice(0, 7)}
        </Pill>
      )}
    </div>
  )
}
