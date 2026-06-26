'use client'

import { useDisciplinas } from '@/hooks/useDisciplinas'
import { useQuestoes } from '@/hooks/useQuestoes'
import { useErros } from '@/hooks/useErros'
import { useRevisoes } from '@/hooks/useRevisoes'
import { useSessoes } from '@/hooks/useSessoes'
import { useSimulados } from '@/hooks/useSimulados'
import { useConfig } from '@/hooks/useConfig'
import { calcReadiness } from '@/lib/domain/readiness'
import { ciclo } from '@/lib/domain/ciclo'
import { taxaGeral, revPend, streak, horasHoje, diasProva, cobertura, indic } from '@/lib/domain/stats'
import { fmtFull, today, clamp } from '@/lib/date'
import { Ring } from '@/components/Ring'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { MiniTimeline } from './MiniTimeline'
import { DISCIPLINAS_PESADAS } from '@/lib/domain/enums'
import type { DimScore } from '@/lib/domain/readiness'

function openStudyModal(disc?: string, assunto?: string) {
  window.dispatchEvent(
    new CustomEvent('open-study-modal', { detail: { disc, assunto } })
  )
}

const ZONA_COLOR: Record<string, string> = {
  red: 'text-red-500 bg-red-50 dark:bg-red-950/40',
  yellow: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/40',
  green: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
}

const DIM_LABELS: Record<string, string> = {
  Edital: 'Cobertura do edital',
  Acertos: 'Taxa de acerto',
  Revisões: 'Revisões em dia',
  Frequência: 'Frequência',
  Simulados: 'Evolução simulados',
}

function readinessMessage(dims: DimScore[], pendCount: number): string {
  const worst = dims.reduce((a, d) => (d.v < a.v ? d : a), dims[0])
  const msgs: Record<string, string> = {
    Edital: 'Avance nos assuntos — o edital está pouco coberto.',
    Acertos: 'Taxa de acerto baixa. Foque em questões das matérias mais pesadas.',
    Revisões:
      pendCount > 0
        ? `Você tem ${pendCount} revisão${pendCount > 1 ? 'ões' : ''} atrasada${pendCount > 1 ? 's' : ''}. Ponha-as em dia para não perder a fixação.`
        : 'Mantenha as revisões em dia para consolidar o aprendizado.',
    Frequência: 'Estude com mais regularidade. Consistência é o fator mais importante.',
    Simulados: 'Faça simulados para medir seu progresso real e ajustar o ciclo.',
  }
  return msgs[worst.k] ?? 'Continue com consistência para melhorar sua pontuação.'
}

export default function HojePage() {
  const { data: disciplinas = [], isLoading: dLoading } = useDisciplinas()
  const { data: questoes = [] } = useQuestoes()
  const { data: erros = [] } = useErros()
  const { data: revisoes = [] } = useRevisoes()
  const { data: sessoes = [] } = useSessoes()
  const { data: simulados = [] } = useSimulados()
  const { data: config } = useConfig()
  if (dLoading || !config) return <HojeSkeleton />

  const readiness = calcReadiness(disciplinas, questoes, revisoes, sessoes, simulados)
  const tg = taxaGeral(questoes)
  const ind = indic(tg)
  const cob = cobertura(disciplinas)
  const pend = revPend(revisoes)
  const fila = ciclo(disciplinas, questoes, erros, revisoes, 4)
  const hojeMin = horasHoje(sessoes)
  const meta = config.meta_diaria
  const metaPct = clamp(Math.round((hojeMin / meta) * 100), 0, 100)
  const st = streak(sessoes)
  const dp = diasProva(config.exam_date)
  const td = today()

  // Próximas revisões (pendentes + hoje)
  const revHoje = revisoes.filter((r) => !r.concluida && r.due_em === td)
  const revAtrasadas = pend.filter((r) => r.due_em < td)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-20 space-y-4">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hoje</h1>
        <p className="text-sm text-muted-foreground">
          {fmtFull(td)}
          {dp != null && <> · <span className="font-medium">{dp} dias para a prova</span></>}
        </p>
      </div>

      {/* ── Prioridades do dia ─────────────────────────────── */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm font-semibold">Prioridades do dia</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {(hojeMin / 60).toFixed(1)}h / {(meta / 60).toFixed(1)}h
          </span>
        </div>

        {/* Barra de progresso espessa */}
        <div className="relative h-3 rounded-full bg-muted overflow-hidden mb-1">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${metaPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mb-4">{metaPct}% da meta diária concluída</p>

        {/* Lista de prioridades como checkboxes */}
        <ul className="space-y-2 mb-5">
          {fila.map((f) => (
            <li
              key={f.disc}
              className="flex items-center gap-3 text-sm cursor-pointer group rounded-lg px-2 py-1.5 hover:bg-muted/60 transition-colors -mx-2"
              onClick={() => openStudyModal(f.disc)}
            >
              <span className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${DISCIPLINAS_PESADAS.has(f.disc) ? 'border-red-400 group-hover:bg-red-50 dark:group-hover:bg-red-950/30' : 'border-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30'}`} />
              <span className="flex-1">Estudar {f.disc}</span>
              <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">+ registrar →</span>
            </li>
          ))}
          {pend.slice(0, 2).map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 text-sm cursor-pointer group rounded-lg px-2 py-1.5 hover:bg-muted/60 transition-colors -mx-2"
              onClick={() => openStudyModal(r.disciplina, r.assunto ?? undefined)}
            >
              <span className="w-4 h-4 rounded border-2 border-emerald-400 shrink-0 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 transition-colors" />
              <span className="flex-1 text-muted-foreground">Revisar {r.assunto ?? r.disciplina}</span>
              <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">+ registrar →</span>
            </li>
          ))}
        </ul>

        {/* Botão principal */}
        <Button
          className="w-full h-11 text-sm font-semibold"
          onClick={() => openStudyModal()}
        >
          + Registrar sessão de estudo
        </Button>
      </div>

      {/* ── Hoje & Revisões ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Hoje</p>
          <p className="text-2xl font-bold tabular-nums">
            {(hojeMin / 60).toFixed(1)}
            <span className="text-sm font-normal text-muted-foreground">h</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            🔥 {st} dia{st !== 1 ? 's' : ''} seguido{st !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Revisões</p>
          <p className={`text-2xl font-bold tabular-nums ${revAtrasadas.length ? 'text-red-500' : ''}`}>
            {revAtrasadas.length}
            <span className="text-sm font-normal text-muted-foreground"> atrasadas</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {revHoje.length > 0
              ? `${revHoje.length} para hoje`
              : pend.length === 0
                ? 'Tudo em dia ✓'
                : `${pend.length} pendente${pend.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            l: 'Edital',
            v: `${cob.pct.toFixed(0)}%`,
            s: `${cob.dom} dominados`,
            c: cob.pct >= 70 ? 'text-emerald-500' : cob.pct >= 30 ? 'text-yellow-500' : '',
          },
          {
            l: 'Questões',
            v: questoes.reduce((a, q) => a + q.total, 0).toString(),
            s: `${questoes.length} sessões`,
          },
          {
            l: 'Acertos',
            v: tg == null ? '—' : `${tg.toFixed(0)}%`,
            s: ind.label,
            c: tg == null ? '' : tg >= 70 ? 'text-emerald-500' : tg >= 60 ? 'text-yellow-500' : 'text-red-500',
          },
          {
            l: 'Simulados',
            v: simulados.length.toString(),
            s: simulados.length
              ? `${((simulados.at(-1)!.acertos / simulados.at(-1)!.total) * 100).toFixed(0)}% último`
              : 'nenhum',
          },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl border bg-card px-4 py-3">
            <p className="text-[11px] text-muted-foreground font-medium">{k.l}</p>
            <p className={`text-2xl font-bold mt-0.5 tabular-nums ${k.c ?? ''}`}>{k.v}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{k.s}</p>
          </div>
        ))}
      </div>

      {/* ── Readiness Score ────────────────────────────────── */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-semibold mb-1">Readiness Score</p>
            <p className="text-xs text-muted-foreground">Como você está para a prova</p>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ZONA_COLOR[readiness.zona.color]}`}
          >
            {readiness.zona.label}
          </span>
        </div>

        <div className="flex items-center gap-5 mb-4">
          <Ring score={readiness.score} color={readiness.zona.color} size={88} />
          <div className="flex-1 space-y-2.5">
            {readiness.dims.map((d) => (
              <div key={d.k} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{DIM_LABELS[d.k] ?? d.k}</span>
                  <span className="text-[11px] font-mono font-medium tabular-nums">{d.v}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      d.v >= 70 ? 'bg-emerald-500' : d.v >= 45 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${d.v}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
          💡 {readinessMessage(readiness.dims, pend.length)}
        </div>
      </div>

      {/* ── Mini-timeline ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">Cronograma · 12 Semanas</p>
          <a href="/timeline" className="text-xs text-primary hover:underline">
            Ver completo →
          </a>
        </div>
        <MiniTimeline
          disciplinas={disciplinas}
          questoes={questoes}
          erros={erros}
          revisoes={revisoes}
          sessoes={sessoes}
          config={config}
        />
      </div>

    </div>
  )
}

function HojeSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-52 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
      <Skeleton className="h-44 rounded-2xl" />
    </div>
  )
}
