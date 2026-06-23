'use client'

import { useState } from 'react'
import { useDisciplinas, useUpdateDisciplina, useCreateDisciplina } from '@/hooks/useDisciplinas'
import { useQuestoes } from '@/hooks/useQuestoes'
import { useErros } from '@/hooks/useErros'
import { useRevisoes } from '@/hooks/useRevisoes'
import { useSessoes } from '@/hooks/useSessoes'
import { discProg, statDisc, revPend, horasDisc, indic } from '@/lib/domain/stats'
import { PRIORIDADE_COLOR, STATUS_DISCIPLINA, PRIORIDADES } from '@/lib/domain/enums'
import { Tag } from '@/components/Tag'
import { Progress } from '@/components/Progress'
import { Peek, PeekBar } from '@/components/Peek'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { Disciplina } from '@/lib/domain/types'
import { KanbanBoard } from './KanbanBoard'

type View = 'tabela' | 'board'

const DSTATUS_COLOR_MAP: Record<string, string> = {
  'Não iniciada': 'gray', 'Em andamento': 'blue', 'Em revisão': 'yellow', Concluída: 'green',
}

export default function DisciplinasPage() {
  const { data: disciplinas = [], isLoading } = useDisciplinas()
  const { data: questoes = [] } = useQuestoes()
  const { data: erros = [] } = useErros()
  const { data: revisoes = [] } = useRevisoes()
  const { data: sessoes = [] } = useSessoes()
  const update = useUpdateDisciplina()
  const criar = useCreateDisciplina()
  const [view, setView] = useState<View>('tabela')
  const [query, setQuery] = useState('')
  const [peekDisc, setPeekDisc] = useState<Disciplina | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newNome, setNewNome] = useState('')
  const [newPeso, setNewPeso] = useState('1')
  const [newPrio, setNewPrio] = useState('Média')
  const pend = revPend(revisoes)

  if (isLoading) return <Skeleton className="h-64 m-8 rounded-xl" />

  const rows = disciplinas.filter(d =>
    !query || d.nome.toLowerCase().includes(query.toLowerCase()) || d.status.toLowerCase().includes(query.toLowerCase())
  )

  async function criarDisc() {
    if (!newNome.trim()) { toast.error('Informe o nome'); return }
    await criar.mutateAsync({ nome: newNome.trim(), peso: parseInt(newPeso) || 1, prioridade: newPrio as any })
    toast.success('Disciplina criada')
    setShowCreate(false); setNewNome('')
  }

  return (
    <div className="px-4 sm:px-8 py-8 pb-16">
      <p className="text-2xl mb-0.5">📚</p>
      <h1 className="text-2xl font-bold tracking-tight mb-4">Disciplinas</h1>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['tabela', 'board'] as View[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === v ? 'bg-background border shadow-sm text-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
            {v === 'tabela' ? '⊞ Tabela' : '⬛ Board'}
          </button>
        ))}
        <Input placeholder="Buscar…" value={query} onChange={e => setQuery(e.target.value)} className="w-44 h-8 text-sm" />
        <Button size="sm" className="ml-auto" onClick={() => setShowCreate(true)}>+ Nova</Button>
      </div>

      {view === 'tabela' ? (
        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>{['Nome', 'Status', 'Progresso', 'Peso', 'Prioridade', 'Horas'].map(h =>
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map(d => {
                  const pg = discProg(d)
                  const h = horasDisc(d.nome, sessoes)
                  return (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => setPeekDisc(d)}>
                      <td className="px-3 py-2.5 font-medium">📕 {d.nome}</td>
                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                        <Select value={d.status} onValueChange={v => update.mutate({ id: d.id, patch: { status: v as any } })}>
                          <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{STATUS_DISCIPLINA.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2.5 min-w-[120px]">
                        <div className="flex items-center gap-2"><Progress value={pg} className="flex-1" /><span className="text-xs font-mono text-muted-foreground">{pg.toFixed(0)}%</span></div>
                      </td>
                      <td className="px-3 py-2.5"><Tag>{d.peso}</Tag></td>
                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                        <Select value={d.prioridade} onValueChange={v => update.mutate({ id: d.id, patch: { prioridade: v as any } })}>
                          <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{PRIORIDADES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{h.toFixed(1)}h</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!rows.length && <EmptyState emoji="📚" title="Nenhuma disciplina" description="Crie ou aguarde o seed do edital." />}
        </div>
      ) : (
        <KanbanBoard disciplinas={rows} onUpdate={(id, status) => update.mutate({ id, patch: { status: status as any } })} onPeek={setPeekDisc} />
      )}

      {/* Peek detalhes */}
      <Peek open={!!peekDisc} onClose={() => setPeekDisc(null)}>
        {peekDisc && (() => {
          const s = statDisc(peekDisc.nome, questoes, erros)
          const ind = indic(s.taxa)
          const revDisc = pend.filter(r => r.disciplina === peekDisc.nome)
          return <>
            <PeekBar title={peekDisc.nome} subtitle={peekDisc.status} onClose={() => setPeekDisc(null)} />
            <div className="px-6 py-5 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Tag>peso {peekDisc.peso}</Tag>
                <Tag color={PRIORIDADE_COLOR[peekDisc.prioridade]}>{peekDisc.prioridade}</Tag>
                <Tag color={DSTATUS_COLOR_MAP[peekDisc.status]}>{peekDisc.status}</Tag>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Progresso</p><p className="text-xl font-bold">{discProg(peekDisc).toFixed(0)}%</p></div>
                <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Taxa</p><p className={`text-xl font-bold text-[var(--tag-${ind.color})]`}>{s.taxa == null ? '—' : `${s.taxa.toFixed(0)}%`}</p></div>
                <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Questões</p><p className="text-xl font-bold">{s.total}</p></div>
                <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Erros</p><p className="text-xl font-bold">{s.cadErros}</p></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">ASSUNTOS ({(peekDisc.assuntos ?? []).length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {(peekDisc.assuntos ?? []).map(a => <Tag key={a.id} color={a.status === 'dominado' ? 'green' : a.status === 'critico' ? 'red' : 'gray'}>{a.nome}</Tag>)}
                </div>
              </div>
              {revDisc.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">REVISÕES PENDENTES ({revDisc.length})</p>
                  {revDisc.slice(0, 5).map(r => <p key={r.id} className="text-sm text-muted-foreground py-1 border-b">{r.assunto ?? r.disciplina}</p>)}
                </div>
              )}
            </div>
          </>
        })()}
      </Peek>

      {/* Modal criar */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Nova disciplina</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <Input placeholder="Nome" value={newNome} onChange={e => setNewNome(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-muted-foreground">Peso (1-3)</label><Input type="number" min={1} max={3} value={newPeso} onChange={e => setNewPeso(e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground">Prioridade</label>
                <Select value={newPrio} onValueChange={v => setNewPrio(v ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORIDADES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={criarDisc} disabled={criar.isPending}>Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

