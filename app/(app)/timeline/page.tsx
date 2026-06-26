'use client'

import { useState } from 'react'
import { useDisciplinas } from '@/hooks/useDisciplinas'
import { useQuestoes } from '@/hooks/useQuestoes'
import { useErros } from '@/hooks/useErros'
import { useRevisoes } from '@/hooks/useRevisoes'
import { useSessoes } from '@/hooks/useSessoes'
import { useConfig } from '@/hooks/useConfig'
import { weeks14, type Week } from '@/lib/domain/weeks14'
import { today } from '@/lib/date'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDown, ChevronRight } from 'lucide-react'

const MILE_COLOR: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200',
}

function fmtShort(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

function fmtMins(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`
}

function WeekCard({
  week,
  expanded,
  onToggle,
  td,
}: {
  week: Week
  expanded: boolean
  onToggle: () => void
  td: string
}) {
  const pct = week.plan > 0 ? Math.min(100, Math.round((week.exec / week.plan) * 100)) : 0

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden transition-shadow',
        week.isNow && 'ring-2 ring-primary border-primary shadow-md',
        week.exam && 'ring-2 ring-red-500 border-red-500'
      )}
    >
      {/* cabeçalho da semana */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        {expanded
          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        }

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn(
              'text-[11px] font-mono font-bold shrink-0',
              week.isNow ? 'text-primary' : 'text-muted-foreground'
            )}>
              SEM {week.N}
            </span>
            <span className="text-sm font-medium shrink-0">
              {fmtShort(week.ws)} – {fmtShort(week.we)}
            </span>
            {week.isNow && (
              <Badge className="text-[10px] py-0 h-4 px-1.5">agora</Badge>
            )}
            {week.mile && (
              <Badge className={cn('text-[10px] py-0 h-4 px-1.5 border-0', MILE_COLOR[week.mile.color])}>
                {week.mile.label}
              </Badge>
            )}
            {week.planRev > 0 && (
              <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5">
                ♻ {week.planRev} rev.
              </Badge>
            )}
          </div>
        </div>

        {/* barra de progresso */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-muted-foreground hidden sm:block tabular-nums">
            {week.exec.toFixed(0)}h / {week.plan.toFixed(0)}h
          </span>
          <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', pct >= 100 ? 'bg-emerald-500' : 'bg-primary')}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground w-7 text-right tabular-nums">{pct}%</span>
        </div>
      </button>

      {/* dias da semana */}
      {expanded && (
        <div className="border-t">
          {week.days.map((day) => {
            const isPast = day.date < td
            const isToday = day.date === td
            const hasSessao = day.sessMins > 0

            if (!day.isStudy) {
              return (
                <div key={day.date} className="flex items-center gap-3 px-4 py-1.5 border-b last:border-b-0">
                  <span className="w-8 text-[11px] text-muted-foreground/40 shrink-0">{day.label}</span>
                  <span className="text-xs text-muted-foreground/40 w-12 shrink-0">{fmtShort(day.date)}</span>
                  <span className="text-xs text-muted-foreground/40 italic">folga</span>
                </div>
              )
            }

            return (
              <div
                key={day.date}
                className={cn(
                  'flex items-center gap-3 px-4 py-2 border-b last:border-b-0 transition-colors',
                  isToday && 'bg-primary/5',
                  !isToday && isPast && !hasSessao && 'opacity-50'
                )}
              >
                <span className={cn(
                  'w-8 text-[11px] font-semibold shrink-0',
                  isToday ? 'text-primary' : 'text-foreground/70'
                )}>
                  {day.label}
                </span>
                <span className={cn(
                  'text-xs w-12 shrink-0 tabular-nums',
                  isToday ? 'text-primary font-medium' : 'text-muted-foreground'
                )}>
                  {fmtShort(day.date)}
                </span>
                <span className={cn(
                  'flex-1 text-sm truncate',
                  !day.disc && 'text-muted-foreground italic'
                )}>
                  {day.disc || '—'}
                </span>
                {hasSessao ? (
                  <Badge
                    className="text-[10px] py-0 h-5 px-1.5 shrink-0 border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                  >
                    ✓ {fmtMins(day.sessMins)}
                  </Badge>
                ) : isPast && isToday === false ? (
                  <span className="text-[11px] text-muted-foreground/30 shrink-0">–</span>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TimelinePage() {
  const { data: disciplinas = [], isLoading } = useDisciplinas()
  const { data: questoes = [] } = useQuestoes()
  const { data: erros = [] } = useErros()
  const { data: revisoes = [] } = useRevisoes()
  const { data: sessoes = [] } = useSessoes()
  const { data: config } = useConfig()

  const weeks = config
    ? weeks14(config, disciplinas, questoes, erros, revisoes, sessoes)
    : []

  const currentN = weeks.find((w) => w.isNow)?.N ?? 1
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([currentN]))
  const [allOpen, setAllOpen] = useState(false)
  const td = today()

  if (isLoading || !config) return <Skeleton className="h-64 m-8 rounded-xl" />

  function toggleAll() {
    if (allOpen) {
      setExpanded(new Set([currentN]))
    } else {
      setExpanded(new Set(weeks.map((w) => w.N)))
    }
    setAllOpen((v) => !v)
  }

  function toggleWeek(N: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(N)) next.delete(N)
      else next.add(N)
      return next
    })
  }

  const milestones = weeks.filter((w) => w.mile)

  return (
    <div className="px-4 sm:px-8 py-6 pb-16 max-w-3xl mx-auto">
      {/* cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cronograma · 12 Semanas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            26/06 → 20/09/2026 · Prova 20/10 · {(config.meta_diaria / 60).toFixed(1)}h/dia · {config.dias_semana} dias/sem
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={toggleAll} className="self-start sm:self-auto">
          {allOpen ? 'Recolher tudo' : 'Expandir tudo'}
        </Button>
      </div>

      {/* lista de semanas */}
      <div className="space-y-2 mb-10">
        {weeks.map((week) => (
          <WeekCard
            key={week.N}
            week={week}
            expanded={expanded.has(week.N)}
            onToggle={() => toggleWeek(week.N)}
            td={td}
          />
        ))}
      </div>

      {/* marcos */}
      <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Marcos do ciclo</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {milestones.map((w) => (
          <div
            key={w.N}
            className="rounded-xl border bg-card p-3 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => {
              setExpanded((prev) => new Set([...prev, w.N]))
              setTimeout(() => {
                document.getElementById(`week-${w.N}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }, 100)
            }}
          >
            <Badge className={cn('text-[10px] border-0', MILE_COLOR[w.mile!.color])}>
              {w.mile!.label}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Sem. {w.N} · {fmtShort(w.ws)}–{fmtShort(w.we)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
