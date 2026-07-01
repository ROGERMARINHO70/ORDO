'use client'

import { useDisciplinas } from '@/hooks/useDisciplinas'
import { useQuestoes } from '@/hooks/useQuestoes'
import { useErros } from '@/hooks/useErros'
import { useRevisoes } from '@/hooks/useRevisoes'
import { ciclo } from '@/lib/domain/ciclo'
import { statDisc, revPend, indic } from '@/lib/domain/stats'
import { PRIORIDADE_COLOR } from '@/lib/domain/enums'
import { getPlano } from '@/lib/plano'
import { Tag } from '@/components/Tag'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const CLASSE_COLOR: Record<string, string> = {
  'Classe A': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  'Classe B': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'Classe C': 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400',
}
const CLASSE_BAR: Record<string, string> = {
  'A': 'bg-red-400',
  'B': 'bg-blue-400',
  'C': 'bg-slate-400',
}

export default function CicloPage() {
  const { data: disciplinas = [], isLoading } = useDisciplinas()
  const { data: questoes = [] } = useQuestoes()
  const { data: erros = [] } = useErros()
  const { data: revisoes = [] } = useRevisoes()

  const plano = getPlano()

  if (isLoading) return <Skeleton className="h-64 m-8 rounded-xl" />

  const fila = ciclo(disciplinas, questoes, erros, revisoes, 10)
  const pend = revPend(revisoes)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pb-16 space-y-8">

      {/* ── Ciclo Base (plano139) ────────────────────────────────── */}
      <section>
        <h1 className="text-2xl font-bold tracking-tight mb-0.5">Ciclo Base · 30 Blocos</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Sequência fixa de 50min por bloco. Cada passagem completa = {(30 * 50 / 60).toFixed(0)}h de estudo.
        </p>

        {/* Legenda de classes */}
        <div className="flex flex-wrap gap-3 mb-4">
          {Object.entries(plano.classes).map(([cls, desc]) => (
            <div key={cls} className="flex items-center gap-1.5">
              <span className={cn('text-[11px] font-bold px-1.5 py-0.5 rounded', CLASSE_COLOR[`Classe ${cls}`])}>
                {cls}
              </span>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>

        {/* Grid dos 30 blocos */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {plano.cicloBase.map(b => (
            <div
              key={b.pos}
              className="rounded-xl border bg-card p-2.5 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground">{b.pos}</span>
                <span className={cn('text-[10px] font-bold px-1 py-0.5 rounded', CLASSE_COLOR[b.classe])}>
                  {b.classe.replace('Classe ', '')}
                </span>
              </div>
              <p className="text-[11px] font-medium leading-tight">{b.disciplina}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Disciplinas do plano ─────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Disciplinas do Plano</h2>
        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {['Disciplina', 'Classe', 'Horas plan.', 'Freq./ciclo'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plano.disciplinas.map(d => (
                  <tr key={d.disciplina} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 font-medium">{d.disciplina}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn('text-[11px] font-bold px-1.5 py-0.5 rounded', CLASSE_COLOR[`Classe ${d.classe}`])}>
                        {d.classe}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', CLASSE_BAR[d.classe])}
                            style={{ width: `${Math.round((d.horasPlanejadas / 70) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{d.horasPlanejadas}h</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {d.freq}× / 30 blocos
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Fila dinâmica (existente) ────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-0.5">Fila Dinâmica</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Prioriza fraqueza, peso e revisões atrasadas, sem duas pesadas seguidas.
        </p>

        <div className="rounded-xl border bg-card p-4 mb-4 flex flex-wrap gap-2 items-center">
          {fila.map((f, i) => (
            <div key={f.disc} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground">→</span>}
              <Tag color={f.pesada ? 'red' : 'blue'}>
                <span className="font-mono text-[10px] opacity-60 mr-1">{String(i + 1).padStart(2, '0')}</span>
                {f.disc}
              </Tag>
            </div>
          ))}
        </div>

        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {['#', 'Disciplina', 'Peso', 'Prioridade', 'Taxa', 'Erros', 'Rev. atrasadas'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fila.map((f, i) => {
                  const d = disciplinas.find(x => x.nome === f.disc)!
                  const s = statDisc(f.disc, questoes, erros)
                  const ind = indic(s.taxa)
                  const v = pend.filter(r => r.disciplina === f.disc).length
                  return (
                    <tr key={f.disc} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2.5 font-medium">{f.disc}</td>
                      <td className="px-3 py-2.5"><Tag>{d?.peso}</Tag></td>
                      <td className="px-3 py-2.5"><Tag color={PRIORIDADE_COLOR[d?.prioridade ?? 'Baixa']}>{d?.prioridade}</Tag></td>
                      <td className="px-3 py-2.5"><Tag color={ind.color}>{s.taxa == null ? '—' : `${s.taxa.toFixed(0)}%`}</Tag></td>
                      <td className="px-3 py-2.5 font-mono">{s.cadErros}</td>
                      <td className={`px-3 py-2.5 font-mono ${v ? 'text-[var(--tag-red)]' : 'text-muted-foreground'}`}>{v}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  )
}
