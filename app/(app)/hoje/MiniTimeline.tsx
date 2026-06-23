'use client'

import { weeks14 } from '@/lib/domain/weeks14'
import { fmt, clamp } from '@/lib/date'
import { Tag } from '@/components/Tag'
import type { Disciplina, Questao, Erro, Revisao, Sessao, UserConfig } from '@/lib/domain/types'

interface Props {
  disciplinas: Disciplina[]
  questoes: Questao[]
  erros: Erro[]
  revisoes: Revisao[]
  sessoes: Sessao[]
  config: UserConfig
}

export function MiniTimeline({ disciplinas, questoes, erros, revisoes, sessoes, config }: Props) {
  const wks = weeks14(config, disciplinas, questoes, erros, revisoes, sessoes)

  return (
    <div className="overflow-x-auto rounded-xl border bg-card/60 pb-2">
      <div className="flex min-w-max">
        {wks.map((w) => (
          <div
            key={w.N}
            className={`w-44 flex-none border-r last:border-r-0 px-3 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${w.isNow ? 'bg-[var(--tag-blue-bg)]' : ''} ${w.exam ? 'bg-[var(--tag-red-bg)]' : ''}`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground">SEM {w.N}</span>
              {w.isNow && <Tag color="blue" className="text-[9px] px-1 py-0">agora</Tag>}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mb-2">{fmt(w.ws)}–{fmt(w.we)}</p>

            {/* Barra plan vs exec */}
            <div className="flex items-end gap-1 h-8 mb-2">
              <div className="flex-1 rounded-t bg-border" style={{ height: `${clamp(w.plan / 24 * 100, 6, 100)}%` }} title={`${w.plan.toFixed(0)}h plan`} />
              <div className="flex-1 rounded-t bg-primary" style={{ height: `${clamp(w.exec / 24 * 100, 3, 100)}%` }} title={`${w.exec.toFixed(1)}h exec`} />
            </div>

            {w.discs.slice(0, 2).map((d) => (
              <p key={d} className="text-[10px] text-muted-foreground truncate leading-tight">{d}</p>
            ))}
            {w.mile && (
              <span className={`mt-1 inline-block text-[10px] font-semibold text-[var(--tag-${w.mile.color})]`}>
                ● {w.mile.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
