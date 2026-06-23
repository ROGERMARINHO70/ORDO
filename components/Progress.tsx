import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number        // 0–100
  className?: string
  color?: string       // tailwind bg class or css var
}

export function Progress({ value, className, color }: ProgressProps) {
  return (
    <div className={cn('h-1.5 rounded-full bg-border overflow-hidden', className)}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: color ?? 'var(--color-primary)',
        }}
      />
    </div>
  )
}
