'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface PeekProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Peek({ open, onClose, children }: PeekProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* scrim */}
      <div
        className={cn('fixed inset-0 z-40 bg-black/40 transition-opacity', open ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={onClose}
      />
      {/* panel */}
      <aside className={cn(
        'fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-background border-l shadow-2xl transition-transform duration-250',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </>
  )
}

export function PeekBar({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-5 py-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">✕</button>
    </div>
  )
}
