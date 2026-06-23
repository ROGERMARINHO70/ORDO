'use client'

import { useState } from 'react'
import { useDisciplinas } from '@/hooks/useDisciplinas'
import { useQuestoes } from '@/hooks/useQuestoes'
import { useErros } from '@/hooks/useErros'
import { useRevisoes } from '@/hooks/useRevisoes'
import { useSessoes } from '@/hooks/useSessoes'
import { useConfig } from '@/hooks/useConfig'
import { weeks14 } from '@/lib/domain/weeks14'
import { fmt, fmtFull, clamp } from '@/lib/date'
import { Tag } from '@/components/Tag'
import { Peek, PeekBar } from '@/components/Peek'
import { Skeleton } from '@/components/ui/skeleton'
import { DISCIPLINAS_PESADAS } from '@/lib/domain/enums'
import type { Week } from '@/lib/domain/weeks14'

export default function TimelinePage() {
  const { data: disciplinas = [], isLoading } = useDisciplinas()
  const { data: questoes = [] } = useQuestoes()
  const { data: erros = [] } = useErros()
  const { data: revisoes = [] } = useRevisoes()
  const { data: sessoes = [] } = useSessoes()
  const { data: config } = useConfig()
  const [peekWeek, setPeekWeek] = useState<Week | null>(null)

  if (isLoading || !config) return <Skeleton className="h-64 m-8 rounded-xl" />

  const wks = weeks14(config, disciplinas, questoes, erros, revisoes, sessoes)
  const milestones = wks.filter((w) => w.mile)

  return (
    <div className="px-4 sm:px-8 py-8 pb-16 max-w-full">
      <p className="text-2xl mb-0.5">🗓️</p>
      <h1 className="text-2xl font-bold tracking-tight mb-0.5">Cronograma · 14 Semanas</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {fmtFull(wks[0]?.ws ?? '')} → Prova em {fmtFull(config.exam_date)} · meta {(config.meta_diaria / 60).toFixed(1)}h/dia, {config.dias_semana} dias/sem
      </p>

      {/* Legenda */}
      <div className="flex gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-border" />Planejado</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary" />Executado</span>
      </div>

      {/* Scroll horizontal */}
      <div className="overflow-x-auto rounded-xl border bg-card/60 mb-8">
        <div className="flex min-w-max">
          {wks.map((w) => (
            <button
              key={w.N}
              onClick={() => setPeekWeek(w)}
              className={`w-44 flex-none border-r last:border-r-0 px-3 py-3 text-left hover:bg-muted/50 transition-colors
                ${w.isNow ? 'bg-[var(--tag-blue-bg)]' : ''}
                ${w.exam ? 'bg-[var(--tag-red-bg)]' : ''}`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-bold text-muted-foreground">SEM {w.N}</span>
                {w.isNow && <Tag color="blue" className="text-[9px]">agora</Tag>}
              </div>
              <p className="text-[10px] font-mono text-muted-foreground mb-2">{fmt(w.ws)}–{fmt(w.we)}</p>
              <div className="flex items-end gap-1 h-10 mb-2">
                <div className="flex-1 rounded-t bg-border min-h-[3px]" style={{ height: `${clamp(w.plan / 24 * 100, 4, 100)}%` }} />
                <div className="flex-1 rounded-t bg-primary min-h-[3px]" style={{ height: `${clamp(w.exec / 24 * 100, 3, 100)}%` }} />
              </div>
              {w.discs.map((d) => (
                <p key={d} className="text-[10px] text-muted-foreground truncate leading-tight">{d}</p>
              ))}
              {w.planRev > 0 && (
                <p className="text-[10px] text-[var(--tag-green)] mt-0.5">♻ {w.planRev} rev.</p>
              )}
              {w.mile && (
                <p className={`text-[10px] font-semibold mt-1 text-[var(--tag-${w.mile.color})]`}>● {w.mile.label}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Marcos */}
      <h2 className="text-sm font-semibold mb-3">Marcos do ciclo</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {milestones.map((w) => (
          <div key={w.N} className="rounded-xl border bg-card p-3 cursor-pointer hover:shadow-sm" onClick={() => setPeekWeek(w)}>
            <Tag color={w.mile!.color}>{w.mile!.label}</Tag>
            <p className="text-xs text-muted-foreground mt-2">Sem. {w.N} · {fmt(w.ws)}–{fmt(w.we)}</p>
          </div>
        ))}
      </div>

      {/* Peek semana */}
      <Peek open={!!peekWeek} onClose={() => setPeekWeek(null)}>
        {peekWeek && (
          <>
            <PeekBar title={`Semana ${peekWeek.N}`} subtitle={`${fmtFull(peekWeek.ws)} – ${fmtFull(peekWeek.we)}`} onClose={() => setPeekWeek(null)} />
            <div className="px-6 py-5 space-y-4">
              {peekWeek.mile && <Tag color={peekWeek.mile.color}>{peekWeek.mile.label}</Tag>}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Planejado</p><p className="text-xl font-bold">{peekWeek.plan.toFixed(0)}h</p></div>
                <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Executado</p><p className={`text-xl font-bold text-[var(--tag-${peekWeek.exec >= peekWeek.plan ? 'green' : peekWeek.exec ? 'yellow' : 'gray'})]`}>{peekWeek.exec.toFixed(1)}h</p></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">DISCIPLINAS</p>
                <div className="flex flex-wrap gap-2">
                  {peekWeek.discs.map((d) => (
                    <Tag key={d} color={DISCIPLINAS_PESADAS.has(d) ? 'red' : 'blue'}>{d}</Tag>
                  ))}
                </div>
              </div>
              {peekWeek.planRev > 0 && (
                <p className="text-sm text-[var(--tag-green)]">♻ {peekWeek.planRev} revisões nesta janela</p>
              )}
            </div>
          </>
        )}
      </Peek>
    </div>
  )
}
