'use client'

import { useState } from 'react'
import { useQuestoes, useCreateQuestao, useUpdateQuestao, useDeleteQuestao } from '@/hooks/useQuestoes'
import { useDisciplinas } from '@/hooks/useDisciplinas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tag } from '@/components/Tag'
import { EmptyState } from '@/components/EmptyState'
import { toast } from 'sonner'
import { fmt } from '@/lib/date'
import type { Questao } from '@/lib/domain/types'

function indicColor(taxa: number) { return taxa >= 70 ? 'green' : taxa >= 45 ? 'yellow' : 'red' }

type FormState = {
  disciplina: string
  assunto: string
  total: string
  acertos: string
  tempo_medio: string
  data: string
}

const EMPTY_FORM: FormState = {
  disciplina: '',
  assunto: '',
  total: '',
  acertos: '',
  tempo_medio: '',
  data: new Date().toISOString().slice(0, 10),
}

export default function QuestoesPage() {
  const { data: questoes = [], isLoading } = useQuestoes()
  const { data: disciplinas = [] } = useDisciplinas()
  const criar = useCreateQuestao()
  const atualizar = useUpdateQuestao()
  const deletar = useDeleteQuestao()

  const [filterDisc, setFilterDisc] = useState('')
  const [filterAssunto, setFilterAssunto] = useState('')

  // null = closed, 'create' = new, questao object = editing
  const [dialog, setDialog] = useState<null | 'create' | Questao>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState<Questao | null>(null)

  if (isLoading) return <Skeleton className="h-64 m-8 rounded-xl" />

  const assuntosDaDiscFiltro = disciplinas.find((d) => d.nome === filterDisc)?.assuntos ?? []
  const assuntosDaDiscForm = disciplinas.find((d) => d.nome === form.disciplina)?.assuntos ?? []

  const rows = questoes
    .filter((q) => !filterDisc || q.disciplina === filterDisc)
    .filter((q) => !filterAssunto || q.assunto === filterAssunto)

  const totalQ = rows.reduce((s, q) => s + q.total, 0)
  const totalA = rows.reduce((s, q) => s + q.acertos, 0)
  const taxaGeral = totalQ ? (totalA / totalQ) * 100 : null

  function openCreate() {
    setForm(EMPTY_FORM)
    setDialog('create')
  }

  function openEdit(q: Questao) {
    setForm({
      disciplina: q.disciplina,
      assunto: q.assunto ?? '',
      total: String(q.total),
      acertos: String(q.acertos),
      tempo_medio: q.tempo_medio ? String(q.tempo_medio) : '',
      data: q.data,
    })
    setDialog(q)
  }

  function closeDialog() {
    setDialog(null)
    setForm(EMPTY_FORM)
  }

  function validate(): boolean {
    if (!form.disciplina || !form.total || !form.acertos) {
      toast.error('Preencha os campos obrigatórios')
      return false
    }
    if (parseInt(form.acertos) > parseInt(form.total)) {
      toast.error('Acertos não pode ser maior que total')
      return false
    }
    return true
  }

  async function salvar() {
    if (!validate()) return
    const payload = {
      disciplina: form.disciplina,
      assunto: form.assunto || undefined,
      total: parseInt(form.total),
      acertos: parseInt(form.acertos),
      tempo_medio: parseFloat(form.tempo_medio) || 0,
      data: form.data,
    }
    try {
      if (dialog === 'create') {
        await criar.mutateAsync(payload as Omit<Questao, 'id'>)
        toast.success('Sessão registrada')
      } else if (dialog && typeof dialog === 'object') {
        await atualizar.mutateAsync({ id: dialog.id, ...payload })
        toast.success('Sessão atualizada')
      }
      closeDialog()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar. Tente novamente.')
    }
  }

  async function confirmarDelete() {
    if (!confirmDelete) return
    try {
      await deletar.mutateAsync(confirmDelete.id)
      toast.success('Sessão removida')
      setConfirmDelete(null)
    } catch {
      toast.error('Erro ao remover')
    }
  }

  const isPending = criar.isPending || atualizar.isPending

  return (
    <div className="px-4 sm:px-8 py-8 pb-16">
      <p className="text-2xl mb-0.5">📝</p>
      <h1 className="text-2xl font-bold tracking-tight mb-4">Questões</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { l: 'Sessões', v: rows.length },
          { l: 'Total', v: totalQ },
          { l: 'Acertos', v: totalA },
          {
            l: 'Taxa geral',
            v: taxaGeral != null ? `${taxaGeral.toFixed(1)}%` : '—',
            c: taxaGeral != null ? indicColor(taxaGeral) : 'gray',
          },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{k.l}</p>
            <p className={`text-2xl font-bold mt-1 ${k.c ? `text-[var(--tag-${k.c})]` : ''}`}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Select
          value={filterDisc}
          onValueChange={(v) => { setFilterDisc(v ?? ''); setFilterAssunto('') }}
        >
          <SelectTrigger className="h-8 w-48 text-sm">
            <SelectValue placeholder="Todas as disciplinas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {disciplinas.map((d) => <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        {filterDisc && assuntosDaDiscFiltro.length > 0 && (
          <Select value={filterAssunto} onValueChange={(v) => setFilterAssunto(v ?? '')}>
            <SelectTrigger className="h-8 w-48 text-sm">
              <SelectValue placeholder="Todos os assuntos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {assuntosDaDiscFiltro.map((a) => <SelectItem key={a.id} value={a.nome}>{a.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Button size="sm" className="ml-auto" onClick={openCreate}>+ Registrar</Button>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {['Data', 'Disciplina', 'Assunto', 'Total', 'Acertos', 'Taxa', 'Tempo', ''].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => {
                const taxa = q.total ? (q.acertos / q.total) * 100 : 0
                return (
                  <tr key={q.id} className="border-b last:border-0 hover:bg-muted/30 group">
                    <td className="px-3 py-2.5 font-mono text-xs">{fmt(q.data)}</td>
                    <td className="px-3 py-2.5">{q.disciplina}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[120px] truncate">{q.assunto ?? '—'}</td>
                    <td className="px-3 py-2.5 font-mono">{q.total}</td>
                    <td className="px-3 py-2.5 font-mono">{q.acertos}</td>
                    <td className="px-3 py-2.5"><Tag color={indicColor(taxa)}>{taxa.toFixed(0)}%</Tag></td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground text-xs">{q.tempo_medio ? `${q.tempo_medio}s` : '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(q)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setConfirmDelete(q)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Remover"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && <EmptyState emoji="📝" title="Nenhuma sessão" description="Registre questões após cada sessão de estudo." />}
      </div>

      {/* Taxa por disciplina */}
      {rows.length > 1 && <TaxaChart questoes={rows} />}

      {/* Dialog criar / editar */}
      <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialog === 'create' ? 'Registrar sessão de questões' : 'Editar sessão'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Select
              value={form.disciplina}
              onValueChange={(v) => setForm((f) => ({ ...f, disciplina: v ?? '', assunto: '' }))}
            >
              <SelectTrigger><SelectValue placeholder="Disciplina *" /></SelectTrigger>
              <SelectContent>
                {disciplinas.map((d) => <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>)}
              </SelectContent>
            </Select>

            {assuntosDaDiscForm.length > 0 && (
              <Select value={form.assunto} onValueChange={(v) => setForm((f) => ({ ...f, assunto: v ?? '' }))}>
                <SelectTrigger><SelectValue placeholder="Assunto (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {assuntosDaDiscForm.map((a) => <SelectItem key={a.id} value={a.nome}>{a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Total *</label>
                <Input
                  type="number"
                  min={1}
                  value={form.total}
                  onChange={(e) => setForm((f) => ({ ...f, total: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Acertos *</label>
                <Input
                  type="number"
                  min={0}
                  value={form.acertos}
                  onChange={(e) => setForm((f) => ({ ...f, acertos: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tempo médio (s)</label>
                <Input
                  type="number"
                  min={0}
                  value={form.tempo_medio}
                  onChange={(e) => setForm((f) => ({ ...f, tempo_medio: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Data</label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={salvar} disabled={isPending}>
                {isPending ? 'Salvando…' : dialog === 'create' ? 'Salvar' : 'Atualizar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <Dialog open={confirmDelete !== null} onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Remover sessão?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmDelete && (
              <>
                {confirmDelete.disciplina} · {confirmDelete.total} questões · {fmt(confirmDelete.data)}
              </>
            )}
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarDelete} disabled={deletar.isPending}>
              {deletar.isPending ? 'Removendo…' : 'Remover'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TaxaChart({ questoes }: { questoes: Questao[] }) {
  const byDisc: Record<string, { total: number; acertos: number }> = {}
  questoes.forEach((q) => {
    if (!byDisc[q.disciplina]) byDisc[q.disciplina] = { total: 0, acertos: 0 }
    byDisc[q.disciplina].total += q.total
    byDisc[q.disciplina].acertos += q.acertos
  })
  const items = Object.entries(byDisc)
    .map(([d, v]) => ({ d, taxa: v.total ? (v.acertos / v.total) * 100 : 0 }))
    .sort((a, b) => a.taxa - b.taxa)

  return (
    <div className="rounded-xl border bg-card p-4 mt-5">
      <p className="text-sm font-semibold mb-4">Taxa por disciplina</p>
      <div className="space-y-2.5">
        {items.map(({ d, taxa }) => (
          <div key={d} className="flex items-center gap-3">
            <p className="text-xs w-40 truncate">{d}</p>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full bg-[var(--tag-${indicColor(taxa)})]`}
                style={{ width: `${taxa}%`, transition: 'width 0.6s ease' }}
              />
            </div>
            <p className="text-xs font-mono w-10 text-right">{taxa.toFixed(0)}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}
