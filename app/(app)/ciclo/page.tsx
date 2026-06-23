'use client'

import { useDisciplinas } from '@/hooks/useDisciplinas'
import { useQuestoes } from '@/hooks/useQuestoes'
import { useErros } from '@/hooks/useErros'
import { useRevisoes } from '@/hooks/useRevisoes'
import { ciclo } from '@/lib/domain/ciclo'
import { statDisc, revPend, indic } from '@/lib/domain/stats'
import { PRIORIDADE_COLOR } from '@/lib/domain/enums'
import { Tag } from '@/components/Tag'
import { Skeleton } from '@/components/ui/skeleton'

export default function CicloPage() {
  const { data: disciplinas = [], isLoading } = useDisciplinas()
  const { data: questoes = [] } = useQuestoes()
  const { data: erros = [] } = useErros()
  const { data: revisoes = [] } = useRevisoes()

  if (isLoading) return <Skeleton className="h-64 m-8 rounded-xl" />

  const fila = ciclo(disciplinas, questoes, erros, revisoes, 10)
  const pend = revPend(revisoes)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pb-16">
      <p className="text-2xl mb-0.5">🔄</p>
      <h1 className="text-2xl font-bold tracking-tight mb-0.5">Ciclo de Estudos</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Fila dinâmica — prioriza fraqueza, peso e revisões atrasadas, sem duas pesadas seguidas.
      </p>

      {/* Fila visual */}
      <div className="rounded-xl border bg-card p-4 mb-6 flex flex-wrap gap-2 items-center">
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

      {/* Tabela */}
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
    </div>
  )
}
