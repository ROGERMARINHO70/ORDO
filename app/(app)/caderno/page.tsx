'use client'

import { useState } from 'react'
import { useErros, useCreateErro, useUpdateErro, useDeleteErro } from '@/hooks/useErros'
import { useDisciplinas } from '@/hooks/useDisciplinas'
import { rankFraq, padroesTipo } from '@/lib/domain/stats'
import { TIPOS_ERRO } from '@/lib/domain/enums'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tag } from '@/components/Tag'
import { EmptyState } from '@/components/EmptyState'
import { toast } from 'sonner'
import { fmt } from '@/lib/date'
import type { Erro } from '@/lib/domain/types'
import type { TipoErro } from '@/lib/domain/enums'

const DIFICULDADE_COLOR = (d: number) => d >= 4 ? 'red' : d >= 3 ? 'yellow' : 'green'

export default function CadernoPage() {
  const { data: erros = [], isLoading } = useErros()
  const { data: disciplinas = [] } = useDisciplinas()
  const criar = useCreateErro()
  const atualizar = useUpdateErro()
  const excluir = useDeleteErro()

  const [filterDisc, setFilterDisc] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterResolvido, setFilterResolvido] = useState<'todos' | 'abertos' | 'resolvidos'>('abertos')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<{
    disciplina: string; assunto: string; tipo: TipoErro; banca: string; dificuldade: number; gabarito: string; justificativa: string; comentario: string; data: string
  }>({ disciplina: '', assunto: '', tipo: 'Desconhecimento da Matéria', banca: '', dificuldade: 3, gabarito: '', justificativa: '', comentario: '', data: new Date().toISOString().slice(0, 10) })

  if (isLoading) return <Skeleton className="h-64 m-8 rounded-xl" />

  let rows = erros
  if (filterDisc) rows = rows.filter(e => e.disciplina === filterDisc)
  if (filterTipo) rows = rows.filter(e => e.tipo === filterTipo)
  if (filterResolvido === 'abertos') rows = rows.filter(e => !e.resolvido)
  if (filterResolvido === 'resolvidos') rows = rows.filter(e => e.resolvido)
  if (search) rows = rows.filter(e => e.disciplina.toLowerCase().includes(search.toLowerCase()) || (e.assunto ?? '').toLowerCase().includes(search.toLowerCase()))

  const fraqueza = rankFraq(erros).slice(0, 5)
  const padroes = padroesTipo(erros)
  const abertos = erros.filter(e => !e.resolvido).length

  async function salvarErro() {
    if (!form.disciplina || !form.tipo) { toast.error('Preencha os campos obrigatórios'); return }
    await criar.mutateAsync({ disciplina: form.disciplina, assunto: form.assunto || undefined, tipo: form.tipo, banca: form.banca || undefined, dificuldade: form.dificuldade, gabarito: form.gabarito || undefined, justificativa: form.justificativa || undefined, comentario: form.comentario || undefined, data: form.data })
    toast.success('Erro registrado — revisões SRS agendadas')
    setShowCreate(false)
    setForm({ disciplina: '', assunto: '', tipo: 'Desconhecimento da Matéria', banca: '', dificuldade: 3, gabarito: '', justificativa: '', comentario: '', data: new Date().toISOString().slice(0, 10) })
  }

  return (
    <div className="px-4 sm:px-8 py-8 pb-16">
      <p className="text-2xl mb-0.5">📒</p>
      <h1 className="text-2xl font-bold tracking-tight mb-0.5">Caderno de Erros</h1>
      {abertos > 0 && <p className="text-sm text-[var(--tag-red)] mb-4">{abertos} erro{abertos > 1 ? 's' : ''} em aberto</p>}

      {/* KPIs + Fraqueza + Padrões */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {/* Fraqueza ranking */}
        <div className="sm:col-span-2 rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">TOP FRAQUEZAS</p>
          {fraqueza.length ? fraqueza.map((f, i) => (
            <div key={f.chave} className="flex items-center gap-3 py-1.5 border-b last:border-0">
              <span className="font-mono text-xs text-muted-foreground w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{f.chave}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Tag>{f.count} erros</Tag>
                {f.rec > 0 && <Tag color="red">{f.rec} rec.</Tag>}
                {f.abertos > 0 && <Tag color="yellow">{f.abertos} abertos</Tag>}
              </div>
            </div>
          )) : <p className="text-xs text-muted-foreground">Nenhum erro registrado</p>}
        </div>

        {/* Padrões por tipo */}
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">TIPOS DE ERRO</p>
          {padroes.length ? padroes.map(({ k, v }) => (
            <div key={k} className="flex items-center justify-between py-1 border-b last:border-0">
              <p className="text-xs truncate max-w-[140px]">{k}</p>
              <Tag>{v}</Tag>
            </div>
          )) : <p className="text-xs text-muted-foreground">—</p>}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Input placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} className="w-36 h-8 text-sm" />
        <Select value={filterDisc} onValueChange={v => setFilterDisc(v ?? "")}>
          <SelectTrigger className="h-8 w-44 text-sm"><SelectValue placeholder="Disciplina" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {disciplinas.map(d => <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={v => setFilterTipo(v ?? "")}>
          <SelectTrigger className="h-8 w-44 text-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {TIPOS_ERRO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterResolvido} onValueChange={v => setFilterResolvido(v as any)}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="abertos">Abertos</SelectItem>
            <SelectItem value="resolvidos">Resolvidos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="ml-auto" onClick={() => setShowCreate(true)}>+ Erro</Button>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {rows.map(e => (
          <ErroCard
            key={e.id}
            erro={e}
            expanded={expandedId === e.id}
            onToggle={() => setExpandedId(expandedId === e.id ? null : e.id)}
            onResolver={() => atualizar.mutate({ id: e.id, patch: { resolvido: true } })}
            onDelete={() => { if (confirm('Excluir erro?')) excluir.mutate(e.id) }}
          />
        ))}
        {!rows.length && <EmptyState emoji="📒" title="Nenhum erro" description="Registre erros para construir o caderno de revisões." />}
      </div>

      {/* Modal criar */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar erro</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <Select value={form.disciplina} onValueChange={v => setForm(f => ({ ...f, disciplina: v ?? "" }))}>
              <SelectTrigger><SelectValue placeholder="Disciplina *" /></SelectTrigger>
              <SelectContent>{disciplinas.map(d => <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Assunto" value={form.assunto} onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))} />
            <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: (v ?? f.tipo) as TipoErro }))}>
              <SelectTrigger><SelectValue placeholder="Tipo *" /></SelectTrigger>
              <SelectContent>{TIPOS_ERRO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Dificuldade (1-5)</label>
                <Input type="number" min={1} max={5} value={form.dificuldade} onChange={e => setForm(f => ({ ...f, dificuldade: parseInt(e.target.value) || 3 }))} />
              </div>
              <div><label className="text-xs text-muted-foreground">Banca</label><Input value={form.banca} onChange={e => setForm(f => ({ ...f, banca: e.target.value }))} /></div>
            </div>
            <Input placeholder="Gabarito / Resposta correta" value={form.gabarito} onChange={e => setForm(f => ({ ...f, gabarito: e.target.value }))} />
            <Input placeholder="Justificativa" value={form.justificativa} onChange={e => setForm(f => ({ ...f, justificativa: e.target.value }))} />
            <Input placeholder="Comentário pessoal" value={form.comentario} onChange={e => setForm(f => ({ ...f, comentario: e.target.value }))} />
            <div><label className="text-xs text-muted-foreground">Data</label><Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={salvarErro} disabled={criar.isPending}>Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ErroCard({ erro, expanded, onToggle, onResolver, onDelete }: {
  erro: Erro; expanded: boolean; onToggle: () => void; onResolver: () => void; onDelete: () => void
}) {
  return (
    <div className={`rounded-xl border bg-card transition-colors ${erro.resolvido ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3 p-3 cursor-pointer" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{erro.disciplina}</p>
            {erro.assunto && <Tag>{erro.assunto}</Tag>}
            <Tag color={DIFICULDADE_COLOR(erro.dificuldade)}>D{erro.dificuldade}</Tag>
            <Tag color="gray">{erro.tipo}</Tag>
            {erro.banca && <Tag>{erro.banca}</Tag>}
            {erro.resolvido && <Tag color="green">Resolvido</Tag>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{fmt(erro.data)}</p>
        </div>
        <span className="text-muted-foreground text-xs pt-0.5">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t pt-3">
          {erro.gabarito && <div><p className="text-xs font-semibold text-muted-foreground">Gabarito</p><p className="text-sm">{erro.gabarito}</p></div>}
          {erro.justificativa && <div><p className="text-xs font-semibold text-muted-foreground">Justificativa</p><p className="text-sm">{erro.justificativa}</p></div>}
          {erro.comentario && <div><p className="text-xs font-semibold text-muted-foreground">Comentário</p><p className="text-sm">{erro.comentario}</p></div>}
          <div className="flex gap-2 pt-1">
            {!erro.resolvido && <Button size="sm" variant="outline" onClick={onResolver}>Marcar resolvido</Button>}
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>Excluir</Button>
          </div>
        </div>
      )}
    </div>
  )
}
