'use client'

import { useMemo, useCallback, useState } from 'react'
import { useDisciplinas } from '@/hooks/useDisciplinas'
import { useQuestoes } from '@/hooks/useQuestoes'
import { useErros } from '@/hooks/useErros'
import { useRevisoes } from '@/hooks/useRevisoes'
import { useSessoes, useCreateSessao } from '@/hooks/useSessoes'
import { useSimulados } from '@/hooks/useSimulados'
import { useConfig } from '@/hooks/useConfig'
import { useCronograma, useSetBlocoStatus, useResetCronograma } from '@/hooks/useCronograma'
import { calcReadiness } from '@/lib/domain/readiness'
import { taxaGeral, revPend, streak, horasHoje, diasProva, cobertura, indic } from '@/lib/domain/stats'
import { fmtFull, today, clamp, between } from '@/lib/date'
import {
  getPlano, proximoBlocoPendente, faseAtual, horasDaSemana, semanaAtual,
  blocosDoDia, statusKey, TIPOS_ESTUDO,
  type BlocoCronograma,
} from '@/lib/plano'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Ring } from '@/components/Ring'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { MiniTimeline } from './MiniTimeline'
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

  const { data: statusMap = {} } = useCronograma()
  const setBlocoStatus = useSetBlocoStatus()
  const criarSessao = useCreateSessao()
  const resetCronograma = useResetCronograma()

  // Hooks devem vir ANTES de qualquer early return
  const td = today()
  const [resetConfirm, setResetConfirm] = useState(false)

  const feitas = useMemo(
    () => new Set(sessoes.filter(s => (s.data ?? '').slice(0, 10) === td).map(s => s.disciplina)),
    [sessoes, td]
  )

  const handleReset = useCallback(async () => {
    try {
      await resetCronograma.mutateAsync()
      setResetConfirm(false)
      toast.success('Progresso zerado. Cronograma reiniciado!')
    } catch (err: unknown) {
      const e = err as Record<string, string>
      toast.error(`Erro ao reiniciar: ${e?.message ?? String(err)}`)
    }
  }, [resetCronograma])

  const handleTogglePlano = useCallback(async (b: BlocoCronograma, checked: boolean) => {
    const errs: string[] = []
    try {
      await setBlocoStatus.mutateAsync({ bloco: b, status: checked ? 'feito' : null })
    } catch (err) {
      const e = err as Record<string, string>
      errs.push(e?.message ?? String(err))
    }
    if (checked) {
      try {
        await criarSessao.mutateAsync({ disciplina: b.disciplina, minutos: b.tempo, data: b.data })
      } catch (err) {
        const e = err as Record<string, string>
        errs.push(e?.message ?? String(err))
      }
    }
    if (errs.length > 0) toast.error(errs.join(' | '))
  }, [setBlocoStatus, criarSessao])

  if (dLoading || !config) return <HojeSkeleton />

  const readiness = calcReadiness(disciplinas, questoes, revisoes, sessoes, simulados)
  const tg = taxaGeral(questoes)
  const ind = indic(tg)
  const cob = cobertura(disciplinas)
  const pend = revPend(revisoes)
  const hojeMin = horasHoje(sessoes)
  const meta = config.meta_diaria
  const metaPct = clamp(Math.round((hojeMin / meta) * 100), 0, 100)
  const st = streak(sessoes)
  const dp = diasProva(config.exam_date)

  // Blocos do plano para hoje (sincronizado com /timeline via cronograma_status)
  const blocosHoje = blocosDoDia(td).filter(b => TIPOS_ESTUDO.has(b.tipo))
  const blocoDoneCount = blocosHoje.filter(b => statusMap[statusKey(b)] === 'feito').length
  const pendVis = pend.filter(r => !feitas.has(r.disciplina)).slice(0, 2)

  // ── Plano 139 Dias ──────────────────────────────────────────────────────────
  const plano = getPlano()
  const nextBloco = proximoBlocoPendente(statusMap)
  const faseHoje = faseAtual(td)?.replace(/^\d+ - /, '') ?? ''
  const semanaHoje = semanaAtual(td)
  const horasSem = horasDaSemana(td, statusMap)
  const metaSem = plano.meta.metaSemanalHoras
  const semPct = clamp(Math.round((horasSem / metaSem) * 100), 0, 100)
  const dpPlano = between(td, plano.meta.prova)

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

      {/* ── Hoje no cronograma ─────────────────────────────── */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between mb-1 gap-2">
          <span className="text-sm font-semibold shrink-0">
            Hoje no cronograma
            {blocosHoje.length > 0 && (
              <span className={cn('ml-2 text-xs font-normal', blocoDoneCount === blocosHoje.length ? 'text-emerald-500' : 'text-muted-foreground')}>
                {blocoDoneCount}/{blocosHoje.length} feitos
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {resetConfirm ? (
              <>
                <button
                  onClick={handleReset}
                  disabled={resetCronograma.isPending}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-60 transition-colors"
                >
                  {resetCronograma.isPending ? 'Zerando…' : 'Confirmar'}
                </button>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={() => setResetConfirm(true)}
                className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors"
                title="Reiniciar progresso"
              >
                Reiniciar
              </button>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
              {(hojeMin / 60).toFixed(1)}h / {(meta / 60).toFixed(1)}h
            </span>
          </div>
        </div>

        {/* Barra de progresso (horas estudadas hoje) */}
        <div className="relative h-3 rounded-full bg-muted overflow-hidden mb-1">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${metaPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mb-4">{metaPct}% da meta diária concluída</p>

        {/* Blocos do plano para hoje */}
        <div className="space-y-1 mb-5">
          {blocosHoje.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">Descanso programado — sem blocos de estudo hoje.</p>
          ) : (
            <>
              {blocosHoje.map(b => {
                const done = statusMap[statusKey(b)] === 'feito'
                return (
                  <div
                    key={`${b.dia}-${b.bloco}`}
                    className={cn('flex items-center gap-3 text-sm rounded-lg px-2 py-1.5', done && 'opacity-60')}
                  >
                    {/* Checkbox: marca no cronograma_status */}
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={e => handleTogglePlano(b, e.target.checked)}
                      className="w-4 h-4 accent-primary cursor-pointer shrink-0"
                    />
                    {/* Clicar no texto abre o modal de registro (questões, notas etc.) */}
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left rounded-md hover:bg-muted/60 active:bg-muted px-1 -mx-1 py-0.5 transition-colors group"
                      onClick={() => openStudyModal(b.disciplina, b.assunto)}
                    >
                      <p className={cn('font-medium truncate', done && 'line-through')}>{b.disciplina}</p>
                      <p className="text-xs text-muted-foreground truncate">{b.assunto}</p>
                      <p className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">+ registrar →</p>
                    </button>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{b.tempo}m</span>
                  </div>
                )
              })}
              {blocoDoneCount === blocosHoje.length && (
                <p className="text-sm text-emerald-500 text-center py-2 font-medium">Tudo feito hoje! 🎉</p>
              )}
            </>
          )}
          {pendVis.map((r) => (
            <button
              key={r.id}
              type="button"
              className="w-full flex items-center gap-3 text-sm text-left rounded-lg px-2 py-2 hover:bg-muted/60 active:bg-muted transition-colors group"
              onClick={() => openStudyModal(r.disciplina, r.assunto ?? undefined)}
            >
              <span className="w-4 h-4 rounded border-2 border-emerald-400 shrink-0 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 transition-colors" />
              <span className="flex-1 text-muted-foreground">Revisar {r.assunto ?? r.disciplina}</span>
              <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">+ registrar →</span>
            </button>
          ))}
        </div>

        {/* Botão principal */}
        <Button
          className="w-full h-11 text-sm font-semibold"
          onClick={() => openStudyModal()}
        >
          + Registrar sessão de estudo
        </Button>

      </div>

      {/* ── Plano 139 Dias ─────────────────────────────────── */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-semibold">Ciclo 144 Dias</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {semanaHoje ? `${semanaHoje.semana} · ` : ''}{faseHoje}
              {dpPlano > 0 && <> · <span className="font-medium">{dpPlano}d p/ prova</span></>}
            </p>
          </div>
          <a href="/timeline" className="text-xs text-primary hover:underline shrink-0 mt-0.5">Ver plano →</a>
        </div>

        {/* Progresso semanal */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Semana</span>
            <span className="tabular-nums">{horasSem.toFixed(1)}h / {metaSem}h · {semPct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${semPct >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
              style={{ width: `${semPct}%` }}
            />
          </div>
        </div>

        {/* Próximo bloco */}
        {nextBloco ? (
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Próximo bloco</p>
            <p className="text-sm font-semibold leading-tight">{nextBloco.disciplina}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{nextBloco.assunto}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{nextBloco.tipo}</span>
              <span className="text-[10px] text-muted-foreground">Dia {nextBloco.dia} · {nextBloco.tempo}min</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-emerald-500 font-medium text-center py-1">Todos os blocos concluídos 🎉</p>
        )}
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
          <p className="text-sm font-semibold">Cronograma · {plano.semanas.length} Semanas</p>
          <a href="/timeline" className="text-xs text-primary hover:underline">
            Ver completo →
          </a>
        </div>
        <MiniTimeline statusMap={statusMap} />
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
