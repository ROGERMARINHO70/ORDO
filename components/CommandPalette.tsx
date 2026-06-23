'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const NAV = [
  { label: 'Hoje', href: '/hoje', icon: '🏠' },
  { label: 'Assistente', href: '/assistente', icon: '✨' },
  { label: 'Timeline', href: '/timeline', icon: '📅' },
  { label: 'Ciclo de Estudos', href: '/ciclo', icon: '🔄' },
  { label: 'Disciplinas', href: '/disciplinas', icon: '📚' },
  { label: 'Assuntos', href: '/assuntos', icon: '🗂️' },
  { label: 'Questões', href: '/questoes', icon: '📝' },
  { label: 'Simulados', href: '/simulados', icon: '🏆' },
  { label: 'Revisões', href: '/revisoes', icon: '🔁' },
  { label: 'Caderno de Erros', href: '/caderno', icon: '📒' },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => { if (open) { setQuery(''); setIdx(0); setTimeout(() => inputRef.current?.focus(), 50) } }, [open])

  const filtered = NAV.filter(n => n.label.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => { setIdx(0) }, [query])

  function select(href: string) { router.push(href); setOpen(false) }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') { if (filtered[idx]) select(filtered[idx].href) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-background border rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-3 py-2.5 border-b">
          <span className="text-muted-foreground">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Navegar para…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground border rounded px-1">ESC</kbd>
        </div>
        <div className="py-1.5 max-h-72 overflow-y-auto">
          {filtered.length ? filtered.map((n, i) => (
            <button key={n.href} onClick={() => select(n.href)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${i === idx ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}
              onMouseEnter={() => setIdx(i)}>
              <span className="text-base">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          )) : (
            <p className="px-3 py-6 text-sm text-muted-foreground text-center">Nenhum resultado</p>
          )}
        </div>
        <div className="border-t px-3 py-1.5 flex gap-3">
          {[['↑↓', 'navegar'], ['↵', 'abrir'], ['⌘K', 'fechar']].map(([k, l]) => (
            <span key={k} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <kbd className="border rounded px-1">{k}</kbd>{l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
