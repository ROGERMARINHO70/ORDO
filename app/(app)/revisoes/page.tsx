'use client'

import { useState } from 'react'
import { useRevisoes, useConcluirRevisao, useReopenRevisao, useCreateRevisao, useDeleteRevisao } from '@/hooks/useRevisoes'
import { useDisciplinas } from '@/hooks/useDisciplinas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tag } from '@/components/Tag'
import { EmptyState } from '@/components/EmptyState'
import { toast } from 'sonner'
import { today, fmt } from '@/lib/date'
import type { Revisao } from '@/lib/domain/types'

type View = 'tabela' | 'calendario'
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function dueColor(due: string, concluida: boolean) {
  if (concluida) return 'green'
  if (due < today()) return 'red'
  if (due === today()) return 'yellow'
  return 'gray'
}

export default function RevisoesPage() {
  const { data: revisoes = [], isLoading } = useRevisoes()
  const { data: disciplinas = [] } = useDisciplinas()
  const concluir = useConcluirRevisao()
  const reabrir = useReopenRevisao()
  const deletar = useDeleteRevisao()
  const criar = useCreateRevisao()

  const [view, setView] = useState<View>('tabela')
  const [filterDisc, setFilterDisc] = useState('')
  const [showConcluidas, setShowConcluidas] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ disciplina: '', assunto: '', dueEm: today(), srs: true })

  if (isLoading) return <Skeleton className="h-64 m-8 rounded-xl" />

  let rows = revisoes
  if (filterDisc) rows = rows.filter(r => r.disciplina === filterDisc)
  if (!showConcluidas) rows = rows.filter(r => !r.concluida)

  const pendentes = revisoes.filter(r => !r.concluida && r.due_em <= today()).length

  async function salvar() {
    if (!form.disciplina) { toast.error('Selecione uma disciplina'); return }
    await criar.mutateAsync({ disciplina: form.disciplina, assunto: form.assunto, dueEm: form.dueEm, srs: form.srs })
    toast.success(form.srs ? 'Série SRS criada' : 'Revisão criada')
    setShowCreate(false); setForm({ disciplina: '', assunto: '', dueEm: today(), srs: true })
  }

  return (
    <div className="px-4 sm:px-8 py-8 pb-16">
      <p className="text-2xl mb-0.5">🔁</p>
      <h1 className="text-2xl font-bold tracking-tight mb-0.5">Revisões</h1>
      {pendentes > 0 && <p className="text-sm text-[var(--tag-red)] mb-4">{pendentes} revisão{pendentes > 1 ? 'ões' : ''} atrasada{pendentes > 1 ? 's' : ''}</p>}

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['tabela', 'calendario'] as View[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === v ? 'bg-background border shadow-sm text-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
            {v === 'tabela' ? '⊞ Tabela' : '📅 Calendário'}
          </button>
        ))}
        <Select value={filterDisc} onValueChange={v => setFilterDisc(v ?? "")}>
          <SelectTrigger className="h-8 w-48 text-sm"><SelectValue placeholder="Todas as disciplinas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {disciplinas.map(d => <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground ml-1">
          <Switch checked={showConcluidas} onCheckedChange={setShowConcluidas} />
          Concluídas
        </label>
        <Button size="sm" className="ml-auto" onClick={() => setShowCreate(true)}>+ Nova</Button>
      </div>

      {view === 'tabela' ? (
        <TabelaView rows={rows} onConcluir={id => concluir.mutate(id)} onReabrir={id => reabrir.mutate(id)} onDelete={id => deletar.mutate(id)} />
      ) : (
        <CalendarioView revisoes={rows} />
      )}

      {/* Modal criar */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Nova revisão</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <Select value={form.disciplina} onValueChange={v => setForm(f => ({ ...f, disciplina: v ?? "" }))}>
              <SelectTrigger><SelectValue placeholder="Disciplina *" /></SelectTrigger>
              <SelectContent>{disciplinas.map(d => <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Assunto (opcional)" value={form.assunto} onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))} />
            <div><label className="text-xs text-muted-foreground">Data da 1ª revisão</label><Input type="date" value={form.dueEm} onChange={e => setForm(f => ({ ...f, dueEm: e.target.value }))} /></div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.srs} onCheckedChange={v => setForm(f => ({ ...f, srs: v }))} />
              Agendar série SRS (1-7-15-30-60 dias)
            </label>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={salvar} disabled={criar.isPending}>Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TabelaView({ rows, onConcluir, onReabrir, onDelete }: {
  rows: Revisao[]
  onConcluir: (id: string) => void
  onReabrir: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (!rows.length) return <EmptyState emoji="🔁" title="Nenhuma revisão" description="Crie revisões ou marque assuntos como 'dominado'." />
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>{['Disciplina', 'Assunto', 'Etapa', 'Prevista', 'Status', ''].map(h =>
              <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className={`border-b last:border-0 hover:bg-muted/30 ${r.concluida ? 'opacity-60' : ''}`}>
                <td className="px-3 py-2.5 font-medium">{r.disciplina}</td>
                <td className="px-3 py-2.5 text-muted-foreground text-xs">{r.assunto ?? '—'}</td>
                <td className="px-3 py-2.5"><Tag color="gray">E{r.etapa + 1}</Tag></td>
                <td className="px-3 py-2.5 font-mono text-xs"><Tag color={dueColor(r.due_em, r.concluida)}>{fmt(r.due_em)}</Tag></td>
                <td className="px-3 py-2.5"><Tag color={r.concluida ? 'green' : 'gray'}>{r.concluida ? 'Concluída' : 'Pendente'}</Tag></td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-3">
                    {r.concluida
                      ? <button onClick={() => onReabrir(r.id)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">reabrir</button>
                      : <button onClick={() => onConcluir(r.id)} className="text-xs text-primary hover:underline">concluir</button>}
                    {confirmId === r.id ? (
                      <>
                        <button
                          onClick={() => { onDelete(r.id); setConfirmId(null) }}
                          className="text-xs text-red-500 font-semibold hover:text-red-600 transition-colors"
                        >confirmar</button>
                        <button onClick={() => setConfirmId(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">cancelar</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmId(r.id)} className="text-xs text-muted-foreground hover:text-red-500 transition-colors">excluir</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CalendarioView({ revisoes }: { revisoes: Revisao[] }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = (firstDay.getDay() + 6) % 7 // monday-based

  const byDay: Record<number, Revisao[]> = {}
  revisoes.forEach(r => {
    const d = new Date(r.due_em + 'T00:00:00')
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate()
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(r)
    }
  })

  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}
          className="p-1 hover:bg-muted rounded">&lt;</button>
        <p className="text-sm font-semibold flex-1 text-center">{MESES[month]} {year}</p>
        <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}
          className="p-1 hover:bg-muted rounded">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground mb-2">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const revs = byDay[day] ?? []
          const isToday = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` === today()
          const hasOver = revs.some(r => !r.concluida && r.due_em < today())
          const hasPend = revs.some(r => !r.concluida)
          return (
            <div key={day} className={`rounded-lg p-1 min-h-[40px] border text-xs ${isToday ? 'border-primary' : 'border-transparent'} ${hasOver ? 'bg-[var(--tag-red-bg)]' : hasPend ? 'bg-[var(--tag-blue-bg)]' : revs.length ? 'bg-[var(--tag-green-bg)]' : 'hover:bg-muted/40'}`}>
              <p className={`font-mono ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{day}</p>
              {revs.slice(0, 2).map(r => <p key={r.id} className="truncate text-[9px] leading-3">{r.assunto ?? r.disciplina}</p>)}
              {revs.length > 2 && <p className="text-[9px] text-muted-foreground">+{revs.length - 2}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
