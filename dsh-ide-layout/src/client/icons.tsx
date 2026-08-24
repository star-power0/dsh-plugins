import type { JSX, ReactNode } from 'react'

interface IconProps {
  size?: number
  className?: string
}

function Icon({ size = 16, className, children }: IconProps & { children: ReactNode }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function IconChevronRight({ size = 14, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" /></Icon>
}

export function IconChevronDown({ size = 14, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><path d="m3 6 5 5 5-5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" /></Icon>
}

export function IconChevronUp({ size = 14, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><path d="m3 10 5-5 5 5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" /></Icon>
}

export function IconArrowLeft({ size = 14, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><path d="M13 8H3M7 4 3 8l4 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></Icon>
}

export function IconExplorer({ size = 16, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><rect x="2" y="1.75" width="12" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.35" /><path d="M6.25 2v12M7.75 5h4.5M7.75 8h4.5M7.75 11h3" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" /></Icon>
}

export function IconFolder({ size = 16, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><path d="M1.75 4.25A1.25 1.25 0 0 1 3 3h3l1.25 1.5H13A1.25 1.25 0 0 1 14.25 5.75v6A1.25 1.25 0 0 1 13 13H3a1.25 1.25 0 0 1-1.25-1.25v-7.5Z" fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></Icon>
}

export function IconFile({ size = 16, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><path d="M3 1.75h6l4 4v8.5H3V1.75Z" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" /><path d="M9 1.75v4h4" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" /></Icon>
}

export function IconAlert({ size = 14, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><path d="m8 2 6 11H2L8 2Z" fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M8 5.5v3.2M8 11.2v.1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></Icon>
}

export function IconGit({ size = 14, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><path d="M5 3.25a1.5 1.5 0 1 0 0 3h.3v3.5H5a1.5 1.5 0 1 0 0 3h.3a1.5 1.5 0 1 0 0-3H5.7v-3.5H8.3v3.5H8a1.5 1.5 0 1 0 0 3h.3a1.5 1.5 0 1 0 0-3H9V6.25h2a1.5 1.5 0 1 0 0-3h-2a1.5 1.5 0 1 0-3 0H5Z" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" /></Icon>
}

export function IconPanel({ size = 14, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><rect x="1.25" y="1.5" width="13.5" height="13" rx="2" stroke="currentColor" strokeWidth="1.15" /><path d="M5 2v12" stroke="currentColor" strokeWidth="1.15" /></Icon>
}

export function IconEye({ size = 14, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><path d="M1.75 8s2.1-3.25 6.25-3.25S14.25 8 14.25 8s-2.1 3.25-6.25 3.25S1.75 8 1.75 8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" /></Icon>
}

export function IconEdit({ size = 14, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><path d="m10.9 2.1 3 3-7.8 7.8-3.5.5.5-3.5 7.8-7.8Z" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" /><path d="m9.1 3.9 3 3" stroke="currentColor" strokeWidth="1.15" /></Icon>
}

export function IconSave({ size = 14, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><path d="M2.25 2.25h9.1l2.4 2.4v9.1H2.25v-11.5Z" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" /><path d="M4.25 2.5v3.25h5.5V2.5M4.5 13.5V9.25h7v4.25" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" /></Icon>
}

export function IconTerminal({ size = 14, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><rect x="1.5" y="2" width="13" height="11.5" rx="2" stroke="currentColor" strokeWidth="1.15" /><path d="m4 5.5 2.2 2L4 9.5M7.5 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></Icon>
}

export function IconClose({ size = 14, className }: IconProps): JSX.Element {
  return <Icon size={size} className={className}><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></Icon>
}
