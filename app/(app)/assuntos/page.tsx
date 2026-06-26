'use client'

import { useState } from 'react'
import { useDisciplinas } from '@/hooks/useDisciplinas'
import { useUpdateAssunto, useCreateAssunto } from '@/hooks/useAssuntos'
import { useRevisoes } from '@/hooks/useRevisoes'
import { STATUS_ASSUNTO } from '@/lib/domain/enums'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { fmt, today } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { StatusAssunto } from '@/lib/domain/enums'
import type { Assunto, Disciplina } from '@/lib/domain/types'

const STATUS_DOT: Record<StatusAssunto, string> = {
  nao: 'bg-muted-foreground/40',
  andamento: 'bg-blue-500',
  dominado: 'bg-emerald-500',
  critico: 'bg-red-500',
}

const STATUS_BADGE: Record<StatusAssunto, string> = {
  nao: 'bg-muted text-muted-foreground',
  andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  dominado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  critico: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
}

type Row = { d: Disciplina; a: Assunto }

function revColor(dueEm: string | undefined, td: string): string {
  if (!dueEm) return 'text-muted-foreground'
  if (dueEm < td) return 'text-red-500 font-medium'
  if (dueEm === td) return 'text-yellow-500 font-medium'
  return 'text-emerald-500'
}

export default function AssuntosPage() {
  const { data: disciplinas = [], isLoading } = useDisciplinas()
  const { data: revisoes = [] } = useRevisoes()
  const updateA = useUpdateAssunto()
  const createA = useCreateAssunto()
  const [query, setQuery] = useState('')
  const [filterDisc, setFilterDisc] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newDisc, setNewDisc] = useState('')
  const [newNome, setNewNome] = useState('')
  const td = today()

  if (isLoading) return <Skeleton className="h-64 m-8 rounded-2xl" />

  let rows: Row[] = []
  disciplinas.forEach((d) => (d.assuntos ?? []).forEach((a) => rows.push({ d, a })))

  if (query)
    rows = rows.filter(
      (r) =>
        r.a.nome.toLowerCase().includes(query.toLowerCase()) ||
        r.d.nome.toLowerCase().includes(query.toLowerCase())
    )
  if (filterDisc) rows = rows.filter((r) => r.d.nome === filterDisc)
  if (filterStatus) rows = rows.filter((r) => r.a.status === filterStatus)

  const proximaRev = (nome: string) =>
    revisoes
      .filter((r) => r.assunto === nome && !r.concluida)
      .sort((a, b) => a.due_em.localeCompare(b.due_em))[0]

  const ultimaRev = (nome: string) =>
    revisoes
      .filter((r) => r.assunto === nome && r.concluida)
      .sort((a, b) => b.due_em.localeCompare(a.due_em))[0]

  function handleStatusChange(a: Assunto, d: Disciplina, v: string | null) {
    if (!v) return
    updateA.mutate({ id: a.id, status: v as StatusAssunto, disciplinaNome: d.nome, assuntoNome: a.nome })
    if (v === 'dominado') toast.success('Dominado — revisões agendadas')
  }

  async function salvarAssunto() {
    if (!newNome.trim() || !newDisc) { toast.error('Preencha os campos'); return }
    const disc = disciplinas.find((d) => d.nome === newDisc)
    if (!disc) return
    await createA.mutateAsync({ disciplina_id: disc.id, nome: newNome.trim() })
    toast.success('Assunto criado')
    setShowCreate(false)
    setNewNome('')
  }

  return (
    <div className="px-4 sm:px-8 py-6 pb-16 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-4">🗂️ Assuntos</h1>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          placeholder="Buscar assunto ou disciplina…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 text-sm sm:w-64"
        />
        <Select value={filterDisc} onValueChange={(v) => setFilterDisc(v ?? '')}>
          <SelectTrigger className="h-9 text-sm sm:w-48">
            <SelectValue placeholder="Disciplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as disciplinas</SelectItem>
            {disciplinas.map((d) => (
              <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? '')}>
          <SelectTrigger className="h-9 text-sm sm:w-40">
            <SelectValue placeholder="Nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os níveis</SelectItem>
            {Object.entries(STATUS_ASSUNTO).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="sm:ml-auto h-9"
          onClick={() => { setNewDisc(disciplinas[0]?.nome ?? ''); setShowCreate(true) }}
        >
          + Novo
        </Button>
      </div>

      {rows.length === 0 && (
        <EmptyState emoji="🗂️" title="Nenhum assunto" description="Crie assuntos ou aguarde o seed do edital." />
      )}

      {/* ── Mobile: cards ─────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {rows.map(({ d, a }) => {
          const prox = proximaRev(a.nome)
          const ult = ultimaRev(a.nome)
          return (
            <div key={a.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('w-2.5 h-2.5 rounded-full shrink-0 mt-0.5', STATUS_DOT[a.status])} />
                  <h3 className="text-sm font-medium leading-snug">{a.nome}</h3>
                </div>
                <Badge className={cn('text-[10px] shrink-0 border-0', STATUS_BADGE[a.status])}>
                  {STATUS_ASSUNTO[a.status].label}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mb-3">{d.nome}</p>

              <Select
                value={a.status}
                onValueChange={(v) => handleStatusChange(a, d, v)}
              >
                <SelectTrigger className="h-8 text-xs mb-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_ASSUNTO).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">Última rev.</p>
                  <p className="font-mono">{ult ? fmt(ult.due_em) : '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Próxima rev.</p>
                  <p className={cn('font-mono', revColor(prox?.due_em, td))}>
                    {prox ? fmt(prox.due_em) : '—'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Desktop: tabela ───────────────────────────────── */}
      <div className="hidden md:block rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {['Assunto', 'Disciplina', 'Nível', 'Última rev.', 'Próxima rev.'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ d, a }) => {
                const prox = proximaRev(a.nome)
                const ult = ultimaRev(a.nome)
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-medium">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_DOT[a.status])} />
                        {a.nome}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="secondary" className="text-xs font-normal">{d.nome}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <Select value={a.status} onValueChange={(v) => handleStatusChange(a, d, v)}>
                        <SelectTrigger className="h-7 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_ASSUNTO).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">
                      {ult ? fmt(ult.due_em) : '—'}
                    </td>
                    <td className={cn('px-3 py-2.5 text-xs font-mono', revColor(prox?.due_em, td))}>
                      {prox ? fmt(prox.due_em) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && null}
      </div>

      {/* Modal novo assunto */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Novo assunto</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <Select value={newDisc} onValueChange={(v) => setNewDisc(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Disciplina" /></SelectTrigger>
              <SelectContent>
                {disciplinas.map((d) => (
                  <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Nome do assunto"
              value={newNome}
              onChange={(e) => setNewNome(e.target.value)}
            />
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={salvarAssunto} disabled={createA.isPending}>Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
