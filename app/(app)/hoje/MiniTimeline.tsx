'use client'

import { useMemo } from 'react'
import { getPlano, parsePeriodo, statusKey, TIPOS_ESTUDO } from '@/lib/plano'
import { fmt, today } from '@/lib/date'
import { cn } from '@/lib/utils'

interface Props {
  statusMap: Record<string, string>
}

export function MiniTimeline({ statusMap }: Props) {
  const td = today()

  const weeks = useMemo(() => {
    const plano = getPlano()
    return plano.semanas.map((sem, i) => {
      const N = i + 1
      const [ws, we] = parsePeriodo(sem.periodo)
      const blocos = plano.cronograma.filter(b => b.data >= ws && b.data <= we && TIPOS_ESTUDO.has(b.tipo))
      const done = blocos.filter(b => statusMap[statusKey(b)] === 'feito').length
      const total = blocos.length
      const pct = total > 0 ? done / total : 0
      const discs = [...new Set(blocos.map(b => b.disciplina))].slice(0, 2)
      const isNow = td >= ws && td <= we
      const faseName = sem.fase.replace(/^\d+ - /, '')
      return { N, ws, we, done, total, pct, discs, isNow, faseName }
    })
  }, [statusMap, td])

  return (
    <div className="overflow-x-auto rounded-xl border bg-card/60 pb-2">
      <div className="flex min-w-max">
        {weeks.map((w) => (
          <div
            key={w.N}
            className={cn(
              'w-44 flex-none border-r last:border-r-0 px-3 py-3',
              w.isNow && 'bg-[var(--tag-blue-bg)]'
            )}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground">SEM {w.N}</span>
              {w.isNow && <span className="text-[9px] text-primary font-semibold">agora</span>}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mb-2">{fmt(w.ws)}–{fmt(w.we)}</p>

            {/* Barra: cinza = planejado, primary = concluído */}
            <div className="flex items-end gap-1 h-8 mb-2">
              <div className="flex-1 rounded-t bg-border h-full" />
              <div
                className="flex-1 rounded-t bg-primary transition-all duration-300"
                style={{ height: `${Math.max(3, w.pct * 100)}%` }}
                title={`${w.done}/${w.total} feitos`}
              />
            </div>

            {w.discs.map(d => (
              <p key={d} className="text-[10px] text-muted-foreground truncate leading-tight">{d}</p>
            ))}
            {w.total > 0 && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 tabular-nums">
                {w.done}/{w.total} · {w.faseName}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
