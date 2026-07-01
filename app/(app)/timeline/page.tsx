'use client'

import { useState, useCallback } from 'react'
import { useCronograma, useSetBlocoStatus } from '@/hooks/useCronograma'
import { useCreateSessao } from '@/hooks/useSessoes'
import {
  getPlano, proximoBlocoPendente, parsePeriodo, statusKey,
  type BlocoCronograma, type SemanaPlano, type TipoBloco,
} from '@/lib/plano'
import { today, between } from '@/lib/date'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDown, ChevronRight } from 'lucide-react'

// ── Constants ──────────────────────────────────────────────────────────────────

const FASES = ['1 - Fundação', '2 - Aprofundamento', '3 - Consolidação', '4 - Reta Final'] as const
const FASE_LABEL: Record<string, string> = {
  '1 - Fundação': 'Fundação', '2 - Aprofundamento': 'Aprofundamento',
  '3 - Consolidação': 'Consolidação', '4 - Reta Final': 'Reta Final',
}
const FASE_BAR: Record<string, string> = {
  '1 - Fundação': 'bg-blue-500', '2 - Aprofundamento': 'bg-violet-500',
  '3 - Consolidação': 'bg-orange-500', '4 - Reta Final': 'bg-red-500',
}
const TIPO_COLOR: Partial<Record<TipoBloco, string>> = {
  'Teoria': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  'Teoria 2ª passada': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  'Questões': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  'Questões intensivas': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  'Questões dirigidas': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  'Revisão Semanal': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  'Revisão Mensal': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  'Revisão Bimestral': 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  'Revisão de resumos': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  'Simulado': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  'Descanso': 'bg-muted text-muted-foreground',
}
const TIPOS_ESTUDO = new Set<TipoBloco>([
  'Teoria','Teoria 2ª passada','Questões','Questões intensivas','Questões dirigidas',
  'Revisão Semanal','Revisão Mensal','Revisão Bimestral','Revisão de resumos','Simulado',
])

function fmtDate(iso: string) {
  const [, m, d] = iso.split('-'); return `${d}/${m}`
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function BlocoRow({
  b, done, isToday, onToggle,
}: {
  b: BlocoCronograma; done: boolean; isToday: boolean
  onToggle: (checked: boolean) => void
}) {
  const isStudy = TIPOS_ESTUDO.has(b.tipo)
  return (
    <div className={cn('flex items-start gap-2.5 px-4 py-2 border-b last:border-b-0 transition-colors',
      isToday && 'bg-primary/5',
      done && 'opacity-60',
    )}>
      {isStudy ? (
        <input
          type="checkbox" checked={done} aria-label={`Marcar ${b.bloco} feito`}
          onChange={e => onToggle(e.target.checked)}
          className="mt-0.5 w-4 h-4 shrink-0 accent-primary cursor-pointer"
        />
      ) : (
        <span className="mt-0.5 w-4 h-4 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', done && 'line-through')}>{b.disciplina}</p>
        <p className="text-[11px] text-muted-foreground truncate">{b.assunto}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', TIPO_COLOR[b.tipo] ?? 'bg-muted text-muted-foreground')}>
          {b.tipo}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums">{b.tempo}m</span>
      </div>
    </div>
  )
}

function WeekCard({
  sem, statusMap, td, expanded, onExpand, onToggle,
}: {
  sem: SemanaPlano; statusMap: Record<string, string>; td: string
  expanded: boolean; onExpand: () => void
  onToggle: (b: BlocoCronograma, checked: boolean) => void
}) {
  const plano = getPlano()
  const [start, end] = parsePeriodo(sem.periodo)
  const blocos = plano.cronograma.filter(b => b.data >= start && b.data <= end)
  const study = blocos.filter(b => TIPOS_ESTUDO.has(b.tipo))
  const done = study.filter(b => statusMap[statusKey(b)] === 'feito').length
  const pct = study.length ? Math.round((done / study.length) * 100) : 0
  const isNow = td >= start && td <= end

  // Group blocks by date
  const byDate: Record<string, BlocoCronograma[]> = {}
  for (const b of blocos) { (byDate[b.data] ??= []).push(b) }
  const dates = Object.keys(byDate).sort()

  return (
    <div className={cn('rounded-xl border overflow-hidden', isNow && 'ring-2 ring-primary border-primary')}>
      <button onClick={onExpand}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn('text-[11px] font-mono font-bold', isNow ? 'text-primary' : 'text-muted-foreground')}>
              {sem.semana.replace('Semana ', 'SEM ')}
            </span>
            <span className="text-sm font-medium">{sem.periodo}</span>
            {isNow && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">agora</span>}
            <span className="text-[10px] text-muted-foreground">{FASE_LABEL[sem.fase]}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-muted-foreground tabular-nums hidden sm:block">{done}/{study.length}</span>
          <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full', pct >= 100 ? 'bg-emerald-500' : 'bg-primary')} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] text-muted-foreground w-7 text-right tabular-nums">{pct}%</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t">
          {dates.map(date => (
            <div key={date}>
              <div className={cn('px-4 py-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/30 border-b',
                date === td && 'text-primary bg-primary/5')}>
                {byDate[date][0].diaSem} · {fmtDate(date)} {date === td && '· hoje'}
              </div>
              {byDate[date].map(b => (
                <BlocoRow
                  key={`${b.dia}-${b.bloco}`} b={b}
                  done={statusMap[statusKey(b)] === 'feito'}
                  isToday={date === td}
                  onToggle={checked => onToggle(b, checked)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TimelinePage() {
  const { data: statusMap = {}, isLoading } = useCronograma()
  const setBlocoStatus = useSetBlocoStatus()
  const criarSessao = useCreateSessao()

  const td = today()
  const plano = getPlano()
  const dpProva = between(td, plano.meta.prova)

  const currentWeekN = plano.semanas.findIndex(s => {
    const [start, end] = parsePeriodo(s.periodo); return td >= start && td <= end
  })
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([Math.max(0, currentWeekN)]))

  const handleToggle = useCallback(async (b: BlocoCronograma, checked: boolean) => {
    await setBlocoStatus.mutateAsync({ bloco: b, status: checked ? 'feito' : null })
    if (checked && TIPOS_ESTUDO.has(b.tipo)) {
      await criarSessao.mutateAsync({ disciplina: b.disciplina, minutos: b.tempo, data: b.data })
    }
  }, [setBlocoStatus, criarSessao])

  const nextBloco = proximoBlocoPendente(statusMap)

  const faseStats = FASES.map(fase => {
    const total = plano.cronograma.filter(b => b.fase === fase && TIPOS_ESTUDO.has(b.tipo))
    const done = total.filter(b => statusMap[statusKey(b)] === 'feito').length
    return { fase, total: total.length, done, pct: total.length ? Math.round((done / total.length) * 100) : 0 }
  })

  if (isLoading) return <div className="p-8 space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-16 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cronograma · 139 Dias</h1>
        <p className="text-sm text-muted-foreground">
          PC-BA Investigador · Prova {fmtDate(plano.meta.prova)}/2026
          {dpProva > 0 && <> · <span className="font-medium">{dpProva} dias restantes</span></>}
        </p>
      </div>

      {/* "Continue" card */}
      {nextBloco && (
        <div className="rounded-2xl border bg-card p-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium mb-1">Continue de onde parou</p>
            <p className="font-semibold truncate">{nextBloco.disciplina}</p>
            <p className="text-sm text-muted-foreground truncate">{nextBloco.assunto}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', TIPO_COLOR[nextBloco.tipo] ?? 'bg-muted text-muted-foreground')}>
                {nextBloco.tipo}
              </span>
              <span className="text-[11px] text-muted-foreground">Dia {nextBloco.dia} · {nextBloco.tempo}min</span>
            </div>
          </div>
          <button
            onClick={() => handleToggle(nextBloco, true)}
            className="shrink-0 text-xs font-semibold px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Marcar feito
          </button>
        </div>
      )}

      {/* Fases */}
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">Progresso por fase</p>
        {faseStats.map(({ fase, done, total, pct }) => (
          <div key={fase}>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{FASE_LABEL[fase]}</span>
              <span className="tabular-nums">{done}/{total} · {pct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', FASE_BAR[fase])} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Semanas */}
      <div className="space-y-2">
        {plano.semanas.map((sem, i) => (
          <WeekCard
            key={sem.semana} sem={sem} statusMap={statusMap} td={td}
            expanded={expanded.has(i)}
            onExpand={() => setExpanded(prev => {
              const next = new Set(prev)
              next.has(i) ? next.delete(i) : next.add(i)
              return next
            })}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}
