'use client'

import { useEffect, useMemo, useState } from 'react'
import { LEIS, MATERIAS, type Lei } from '@/lib/leis'
import { getPlano } from '@/lib/plano'
import { today, between } from '@/lib/date'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const CHAVE = 'pcba-leis-v1'

type Textos = Record<string, string>

function carregarTextos(): Textos {
  try {
    const raw = localStorage.getItem(CHAVE)
    if (!raw) return {}
    const d = JSON.parse(raw)
    return d?.textos ?? {}
  } catch { return {} }
}

function salvarTextos(textos: Textos) {
  try {
    // Preserva outras chaves (ex.: stats de uma versão antiga do arquivo)
    const raw = localStorage.getItem(CHAVE)
    const d = raw ? JSON.parse(raw) : {}
    localStorage.setItem(CHAVE, JSON.stringify({ ...d, textos }))
  } catch {
    toast.error('Não foi possível salvar neste navegador')
  }
}

export default function LeisPage() {
  const [filtro, setFiltro] = useState('todas')
  const [abertas, setAbertas] = useState<Set<string>>(new Set())
  const [editando, setEditando] = useState<string | null>(null)
  const [rascunho, setRascunho] = useState('')
  const [textos, setTextos] = useState<Textos>({})

  useEffect(() => { setTextos(carregarTextos()) }, [])

  const dp = Math.max(0, between(today(), getPlano().meta.prova))

  const daMateria = (k: string) => (k === 'todas' ? LEIS : LEIS.filter(l => l.m === k))
  const grupos = useMemo(
    () => (filtro === 'todas' ? [...MATERIAS] : MATERIAS.filter(m => m.k === filtro)),
    [filtro]
  )

  function toggleAberta(id: string) {
    setAbertas(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    if (editando && editando !== id) setEditando(null)
  }

  function abrirEditor(l: Lei) {
    setEditando(l.id)
    setRascunho(textos[l.id] ?? '')
  }

  function salvar(id: string) {
    const next = { ...textos, [id]: rascunho }
    setTextos(next)
    salvarTextos(next)
    setEditando(null)
    toast.success('Texto salvo neste navegador')
  }

  function apagar(id: string) {
    const next = { ...textos }
    delete next[id]
    setTextos(next)
    salvarTextos(next)
    setEditando(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-16">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="text-2xl mb-0.5">📜</p>
          <h1 className="text-2xl font-bold tracking-tight">Biblioteca de Leis</h1>
          <p className="text-sm text-muted-foreground">
            Edital SAEB 02/2026 · Investigador PC-BA · {LEIS.length} diplomas
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold text-red-500 tabular-nums leading-none">{dp}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">dias até 06/12</p>
        </div>
      </div>

      {/* Filtros por matéria */}
      <div className="flex flex-wrap gap-1.5 py-4">
        {[{ k: 'todas', t: 'Todas' }, ...MATERIAS].map(f => (
          <button
            key={f.k}
            onClick={() => setFiltro(f.k)}
            className={cn(
              'text-[11px] px-2.5 py-1.5 rounded-md border transition-colors',
              filtro === f.k
                ? 'bg-foreground text-background border-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            {f.t} <span className="opacity-60">{daMateria(f.k).length}</span>
          </button>
        ))}
      </div>

      {/* Grupos por matéria */}
      {grupos.map(g => {
        const leis = LEIS.filter(l => l.m === g.k)
        if (!leis.length) return null
        return (
          <section key={g.k}>
            <div className="pt-6 pb-2 border-b mb-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-primary">
                {leis.length} diploma{leis.length > 1 ? 's' : ''}
              </p>
              <h2 className="text-xl font-bold tracking-tight mt-0.5">{g.t}</h2>
            </div>

            {leis.map(l => {
              const temTexto = !!(textos[l.id] ?? '').trim()
              const aberta = abertas.has(l.id)
              return (
                <article
                  key={l.id}
                  className={cn(
                    'rounded-lg border bg-card mb-2.5 border-l-[3px] overflow-hidden',
                    temTexto ? 'border-l-emerald-500' : 'border-l-primary'
                  )}
                >
                  {/* Topo clicável */}
                  <button
                    type="button"
                    onClick={() => toggleAberta(l.id)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                  >
                    {aberta
                      ? <ChevronDown className="w-4 h-4 mt-1 text-muted-foreground shrink-0" />
                      : <ChevronRight className="w-4 h-4 mt-1 text-muted-foreground shrink-0" />}
                    <span className="font-mono text-xs font-bold text-primary mt-0.5 shrink-0 min-w-[96px]">
                      {l.n}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-[15px] leading-snug">{l.nome}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">{l.em}</span>
                    </span>
                  </button>

                  {/* Corpo */}
                  {aberta && (
                    <div className="px-4 pb-4">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-2 mb-1.5">
                        O que o edital cobra
                      </p>
                      <div
                        className="text-sm bg-muted/40 border border-dashed rounded-md px-3 py-2.5 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: l.esc }}
                      />

                      {l.al.length > 0 && (
                        <>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-4 mb-1.5">
                            Alertas de atualização
                          </p>
                          <div className="space-y-1.5">
                            {l.al.map((a, i) => (
                              <div
                                key={i}
                                className="text-[13px] leading-relaxed bg-red-50 dark:bg-red-950/30 border-l-[3px] border-red-500 rounded-r-md px-3 py-2 [&_b]:text-red-600 dark:[&_b]:text-red-400"
                                dangerouslySetInnerHTML={{ __html: a }}
                              />
                            ))}
                          </div>
                        </>
                      )}

                      {/* Ações */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <a
                          href={l.lk}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          Abrir texto oficial <ExternalLink className="w-3 h-3" />
                        </a>
                        {editando !== l.id && (
                          <button
                            onClick={() => abrirEditor(l)}
                            className="text-[11px] uppercase tracking-wider px-3 py-2 rounded-md border hover:border-primary hover:text-primary transition-colors"
                          >
                            {temTexto ? 'Editar texto salvo' : 'Colar texto integral'}
                          </button>
                        )}
                        {temTexto && editando !== l.id && (
                          <button
                            onClick={() => apagar(l.id)}
                            className="text-[11px] uppercase tracking-wider px-3 py-2 rounded-md border hover:border-red-400 hover:text-red-500 transition-colors"
                          >
                            Apagar texto
                          </button>
                        )}
                      </div>

                      {/* Painel: editor ou texto salvo */}
                      {editando === l.id ? (
                        <div className="mt-3">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                            Cole aqui o texto oficial
                          </p>
                          <textarea
                            value={rascunho}
                            onChange={e => setRascunho(e.target.value)}
                            placeholder="Cole o texto copiado do Planalto ou do LegislaBahia…"
                            autoFocus
                            className="w-full min-h-[180px] rounded-md border bg-background px-3 py-2.5 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => salvar(l.id)}
                              className="text-[11px] uppercase tracking-wider font-semibold px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                              Salvar texto
                            </button>
                            <button
                              onClick={() => setEditando(null)}
                              className="text-[11px] uppercase tracking-wider px-3 py-2 rounded-md border hover:bg-muted transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : temTexto ? (
                        <div className="mt-3">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                            Texto salvo
                          </p>
                          <div className="rounded-md border bg-background px-4 py-3 max-h-[460px] overflow-auto text-[15px] leading-[1.75] whitespace-pre-wrap">
                            {textos[l.id]}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-[13px] text-muted-foreground italic">
                          Nenhum texto salvo. Abra o link oficial, copie o trecho indicado em
                          &quot;O que o edital cobra&quot; e cole aqui — fica guardado neste navegador.
                        </p>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </section>
        )
      })}

      {/* Rodapé */}
      <footer className="border-t mt-10 pt-5 text-xs text-muted-foreground leading-relaxed">
        <b className="text-foreground">Sobre o texto das leis:</b> a ficha de cada diploma traz ementa,
        escopo cobrado no edital, alertas de alteração recente e o link oficial. O texto integral você
        cola uma vez, direto do Planalto ou do LegislaBahia, e ele fica salvo neste navegador — assim
        o que você lê é sempre a redação oficial vigente, não uma cópia intermediária. Leis são de
        domínio público (art. 8º, IV, da Lei 9.610/1998).
      </footer>
    </div>
  )
}
