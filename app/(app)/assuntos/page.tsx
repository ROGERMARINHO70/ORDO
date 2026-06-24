'use client'

import { useState } from 'react'
import { useDisciplinas } from '@/hooks/useDisciplinas'
import { useUpdateAssunto, useCreateAssunto } from '@/hooks/useAssuntos'
import { useRevisoes } from '@/hooks/useRevisoes'
import { STATUS_ASSUNTO } from '@/lib/domain/enums'
import { Tag } from '@/components/Tag'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { StatusAssunto } from '@/lib/domain/enums'
import type { Assunto, Disciplina } from '@/lib/domain/types'
import { fmt } from '@/lib/date'

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

  if (isLoading) return <Skeleton className="h-64 m-8 rounded-xl" />

  type Row = { d: Disciplina; a: Assunto }
  let rows: Row[] = []
  disciplinas.forEach(d => (d.assuntos ?? []).forEach(a => rows.push({ d, a })))

  if (query) rows = rows.filter(r => r.a.nome.toLowerCase().includes(query.toLowerCase()) || r.d.nome.toLowerCase().includes(query.toLowerCase()))
  if (filterDisc) rows = rows.filter(r => r.d.nome === filterDisc)
  if (filterStatus) rows = rows.filter(r => r.a.status === filterStatus)

  const proximaRev = (nome: string) => revisoes.filter(r => r.assunto === nome && !r.concluida).sort((a, b) => a.due_em.localeCompare(b.due_em))[0]
  const ultimaRev = (nome: string) => revisoes.filter(r => r.assunto === nome && r.concluida).sort((a, b) => b.due_em.localeCompare(a.due_em))[0]

  async function salvarAssunto() {
    if (!newNome.trim() || !newDisc) { toast.error('Preencha os campos'); return }
    const disc = disciplinas.find(d => d.nome === newDisc)
    if (!disc) return
    await createA.mutateAsync({ disciplina_id: disc.id, nome: newNome.trim() })
    toast.success('Assunto criado'); setShowCreate(false); setNewNome('')
  }

  return (
    <div className="px-4 sm:px-8 py-8 pb-16">
      <p className="text-2xl mb-0.5">🗂️</p>
      <h1 className="text-2xl font-bold tracking-tight mb-4">Assuntos</h1>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Input placeholder="Buscar…" value={query} onChange={e => setQuery(e.target.value)} className="w-44 h-8 text-sm" />
        <Select value={filterDisc} onValueChange={v => setFilterDisc(v ?? '')}>
          <SelectTrigger className="h-8 w-48 text-sm"><SelectValue placeholder="Disciplina" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as disciplinas</SelectItem>
            {disciplinas.map(d => <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v ?? '')}>
          <SelectTrigger className="h-8 w-40 text-sm"><SelectValue placeholder="Nível" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os níveis</SelectItem>
            {Object.entries(STATUS_ASSUNTO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" className="ml-auto" onClick={() => { setNewDisc(disciplinas[0]?.nome ?? ''); setShowCreate(true) }}>+ Novo</Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>{['Assunto', 'Disciplina', 'Nível', 'Última rev.', 'Próxima rev.'].map(h =>
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map(({ d, a }) => {
                const prox = proximaRev(a.nome)
                const ult = ultimaRev(a.nome)
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-medium">{a.nome}</td>
                    <td className="px-3 py-2.5"><Tag>{d.nome}</Tag></td>
                    <td className="px-3 py-2.5">
                      <Select value={a.status} onValueChange={v => {
                        updateA.mutate({ id: a.id, status: v as StatusAssunto, disciplinaNome: d.nome, assuntoNome: a.nome })
                        if (v === 'dominado') toast.success('Dominado — revisões agendadas')
                      }}>
                        <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(STATUS_ASSUNTO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{ult ? fmt(ult.due_em) : '—'}</td>
                    <td className={`px-3 py-2.5 text-xs font-mono ${prox && prox.due_em <= new Date().toISOString().slice(0, 10) ? 'text-[var(--tag-red)]' : 'text-muted-foreground'}`}>
                      {prox ? fmt(prox.due_em) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && <EmptyState emoji="🗂️" title="Nenhum assunto" description="Crie assuntos ou aguarde o seed do edital." />}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Novo assunto</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <Select value={newDisc} onValueChange={v => setNewDisc(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Disciplina" /></SelectTrigger>
              <SelectContent>{disciplinas.map(d => <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Nome do assunto" value={newNome} onChange={e => setNewNome(e.target.value)} />
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
