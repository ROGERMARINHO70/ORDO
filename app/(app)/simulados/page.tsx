'use client'

import { useState } from 'react'
import { useSimulados, useCreateSimulado, useDeleteSimulado } from '@/hooks/useSimulados'
import { useDisciplinas } from '@/hooks/useDisciplinas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tag } from '@/components/Tag'
import { EmptyState } from '@/components/EmptyState'
import { toast } from 'sonner'
import { fmt } from '@/lib/date'
import type { Simulado } from '@/lib/domain/types'

function indicColor(taxa: number) { return taxa >= 70 ? 'green' : taxa >= 45 ? 'yellow' : 'red' }

export default function SimuladosPage() {
  const { data: simulados = [], isLoading } = useSimulados()
  const { data: disciplinas = [] } = useDisciplinas()
  const criar = useCreateSimulado()
  const excluir = useDeleteSimulado()

  const [showCreate, setShowCreate] = useState(false)
  const [nome, setNome] = useState('')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [total, setTotal] = useState('')
  const [acertos, setAcertos] = useState('')
  const [perDisc, setPerDisc] = useState<Record<string, { total: string; acertos: string }>>({})

  if (isLoading) return <Skeleton className="h-64 m-8 rounded-xl" />

  const taxaMedia = simulados.length
    ? simulados.reduce((s, sim) => s + (sim.total ? (sim.acertos / sim.total) * 100 : 0), 0) / simulados.length
    : null

  async function salvar() {
    if (!nome.trim() || !total || !acertos) { toast.error('Preencha os campos obrigatórios'); return }
    const t = parseInt(total), a = parseInt(acertos)
    if (a > t) { toast.error('Acertos não pode ser maior que total'); return }
    const porDisc: Record<string, { total: number; acertos: number }> = {}
    Object.entries(perDisc).forEach(([d, v]) => {
      if (v.total && v.acertos) porDisc[d] = { total: parseInt(v.total), acertos: parseInt(v.acertos) }
    })
    await criar.mutateAsync({ nome: nome.trim(), data, total: t, acertos: a, por_disciplina: porDisc } as Omit<Simulado, 'id'>)
    toast.success('Simulado salvo')
    setShowCreate(false); setNome(''); setTotal(''); setAcertos(''); setPerDisc({})
  }

  return (
    <div className="px-4 sm:px-8 py-8 pb-16">
      <p className="text-2xl mb-0.5">🏆</p>
      <h1 className="text-2xl font-bold tracking-tight mb-4">Simulados</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {[
          { l: 'Realizados', v: simulados.length },
          { l: 'Média geral', v: taxaMedia != null ? `${taxaMedia.toFixed(1)}%` : '—', c: taxaMedia != null ? indicColor(taxaMedia) : 'gray' },
          { l: 'Meta', v: '≥ 70%', c: 'blue' },
        ].map(k => (
          <div key={k.l} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{k.l}</p>
            <p className={`text-2xl font-bold mt-1 ${k.c ? `text-[var(--tag-${k.c})]` : ''}`}>{k.v}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowCreate(true)}>+ Novo simulado</Button>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>{['Data', 'Nome', 'Total', 'Acertos', 'Taxa', ''].map(h =>
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody>
              {simulados.map(sim => {
                const taxa = sim.total ? (sim.acertos / sim.total) * 100 : 0
                return (
                  <tr key={sim.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-mono text-xs">{fmt(sim.data)}</td>
                    <td className="px-3 py-2.5 font-medium">{sim.nome}</td>
                    <td className="px-3 py-2.5 font-mono">{sim.total}</td>
                    <td className="px-3 py-2.5 font-mono">{sim.acertos}</td>
                    <td className="px-3 py-2.5"><Tag color={indicColor(taxa)}>{taxa.toFixed(1)}%</Tag></td>
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={() => { if (confirm('Excluir simulado?')) excluir.mutate(sim.id) }}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors">excluir</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!simulados.length && <EmptyState emoji="🏆" title="Nenhum simulado" description="Registre seus simulados para acompanhar a evolução." />}
      </div>

      {/* Evolução gráfico de linha simplificado */}
      {simulados.length > 1 && <EvolucaoChart simulados={simulados} />}

      {/* Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo simulado</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <Input placeholder="Nome do simulado *" value={nome} onChange={e => setNome(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-muted-foreground">Data</label><Input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
              <div />
              <div><label className="text-xs text-muted-foreground">Total *</label><Input type="number" min={1} value={total} onChange={e => setTotal(e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground">Acertos *</label><Input type="number" min={0} value={acertos} onChange={e => setAcertos(e.target.value)} /></div>
            </div>

            <p className="text-xs font-semibold text-muted-foreground pt-1">Por disciplina (opcional)</p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {disciplinas.map(d => (
                <div key={d.id} className="flex items-center gap-2">
                  <p className="text-xs w-36 truncate">{d.nome}</p>
                  <Input type="number" min={0} placeholder="total" className="h-7 text-xs" value={perDisc[d.nome]?.total ?? ''} onChange={e => setPerDisc(p => ({ ...p, [d.nome]: { ...p[d.nome], total: e.target.value } }))} />
                  <Input type="number" min={0} placeholder="cert." className="h-7 text-xs" value={perDisc[d.nome]?.acertos ?? ''} onChange={e => setPerDisc(p => ({ ...p, [d.nome]: { ...p[d.nome], acertos: e.target.value } }))} />
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={salvar} disabled={criar.isPending}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EvolucaoChart({ simulados }: { simulados: Simulado[] }) {
  const sorted = [...simulados].sort((a, b) => a.data.localeCompare(b.data))
  const taxas = sorted.map(s => ({ d: s.data, t: s.total ? (s.acertos / s.total) * 100 : 0, nome: s.nome }))
  const max = Math.max(...taxas.map(t => t.t), 100)

  return (
    <div className="rounded-xl border bg-card p-4 mt-5">
      <p className="text-sm font-semibold mb-4">Evolução</p>
      <div className="flex items-end gap-2 h-28">
        {taxas.map(({ d, t, nome }) => (
          <div key={d + nome} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-popover border rounded px-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{t.toFixed(1)}%</div>
            <div className={`w-full rounded-t bg-[var(--tag-${indicColor(t)})] opacity-80`} style={{ height: `${(t / max) * 100}%` }} />
            <p className="text-[9px] font-mono text-muted-foreground">{fmt(d)}</p>
          </div>
        ))}
        <div className="border-l border-dashed border-muted-foreground/30 h-full" style={{ height: `${(70 / max) * 100}%`, position: 'absolute', bottom: '1.5rem', right: 0, left: 0 }} />
      </div>
    </div>
  )
}
