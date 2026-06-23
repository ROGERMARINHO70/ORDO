import { cn } from '@/lib/utils'

const COLOR_MAP: Record<string, string> = {
  gray:   'bg-[var(--tag-gray-bg)]   text-[var(--tag-gray)]',
  blue:   'bg-[var(--tag-blue-bg)]   text-[var(--tag-blue)]',
  green:  'bg-[var(--tag-green-bg)]  text-[var(--tag-green)]',
  red:    'bg-[var(--tag-red-bg)]    text-[var(--tag-red)]',
  yellow: 'bg-[var(--tag-yellow-bg)] text-[var(--tag-yellow)]',
  purple: 'bg-[var(--tag-purple-bg)] text-[var(--tag-purple)]',
}

interface TagProps {
  color?: string
  className?: string
  children: React.ReactNode
}

export function Tag({ color = 'gray', className, children }: TagProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
      COLOR_MAP[color] ?? COLOR_MAP.gray,
      className
    )}>
      {children}
    </span>
  )
}
