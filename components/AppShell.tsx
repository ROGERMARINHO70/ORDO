'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from './ThemeProvider'
import { createClient } from '@/lib/supabase/client'
import { useRevisoes } from '@/hooks/useRevisoes'
import { useErros } from '@/hooks/useErros'
import { revPend } from '@/lib/domain/stats'
import { cn } from '@/lib/utils'

const NAV = [
  { group: 'INÍCIO', items: [
    { href: '/hoje', emoji: '🎯', label: 'Hoje' },
    { href: '/assistente', emoji: '✨', label: 'Assistente' },
  ]},
  { group: 'CRONOGRAMA', items: [
    { href: '/timeline', emoji: '🗓️', label: 'Timeline 14 sem.' },
    { href: '/ciclo', emoji: '🔄', label: 'Ciclo de Estudos' },
  ]},
  { group: 'BANCOS DE DADOS', items: [
    { href: '/disciplinas', emoji: '📚', label: 'Disciplinas' },
    { href: '/assuntos', emoji: '🗂️', label: 'Assuntos' },
    { href: '/questoes', emoji: '✅', label: 'Questões' },
    { href: '/simulados', emoji: '📝', label: 'Simulados' },
    { href: '/revisoes', emoji: '♻️', label: 'Revisões' },
    { href: '/caderno', emoji: '🔎', label: 'Caderno de Erros' },
  ]},
]

interface Props { children: React.ReactNode }

export default function AppShell({ children }: Props) {
  const path = usePathname()
  const { toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const { data: revisoes = [] } = useRevisoes()
  const { data: erros = [] } = useErros()
  const pendentes = revPend(revisoes).length
  const errosAbertos = erros.filter((e) => !e.resolvido).length
  const supabase = createClient()

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Scrim mobile */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-muted/60 border-r transition-transform duration-200 md:relative md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 py-3 border-b">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-[var(--tag-purple)] flex items-center justify-center text-white font-bold text-sm">O</div>
          <div><p className="text-sm font-semibold leading-tight">Ordo</p><p className="text-[10px] text-muted-foreground">Aprovação PC-BA</p></div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {NAV.map((g) => (
            <div key={g.group}>
              <p className="px-2 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground tracking-wider">{g.group}</p>
              {g.items.map((item) => {
                const active = path === item.href || path.startsWith(item.href + '/')
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className={cn('flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                      active ? 'bg-background font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                    )}>
                    <span className="text-base leading-none">{item.emoji}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.href === '/revisoes' && pendentes > 0 && (
                      <span className="rounded-full bg-destructive text-white text-[10px] font-semibold px-1.5 py-px">{pendentes}</span>
                    )}
                    {item.href === '/caderno' && errosAbertos > 0 && (
                      <span className="rounded-full bg-muted text-muted-foreground text-[10px] px-1.5 py-px">{errosAbertos}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex items-center gap-1 px-2 py-2 border-t">
          <button onClick={toggle} className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors" title="Tema">◐</button>
          <button onClick={() => supabase.auth.signOut().then(() => (window.location.href = '/login'))}
            className="ml-auto p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors text-xs">
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-11 items-center gap-2 border-b px-4 bg-background/80 backdrop-blur shrink-0">
          <button onClick={() => setOpen((v) => !v)} className="md:hidden p-1 rounded text-muted-foreground hover:text-foreground">
            <svg width="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="flex-1 text-sm text-muted-foreground font-medium truncate">
            {NAV.flatMap((g) => g.items).find((i) => path === i.href || path.startsWith(i.href + '/'))?.label ?? 'Ordo'}
          </div>
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
            className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2 py-1 hover:bg-muted transition-colors"
            title="Abrir paleta de comandos (⌘K)">
            <span>🔍</span>
            <kbd className="text-[10px]">⌘K</kbd>
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
