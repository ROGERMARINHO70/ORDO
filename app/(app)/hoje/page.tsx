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
import { taxaGeral, revPend, streak, horasHoje, diasProva, cobertura } from '@/lib/domain/stats'
import { indic } from '@/lib/domain/stats'
import { fmtFull, today, clamp } from '@/lib/date'
import { Ring } from '@/components/Ring'
import { Tag } from '@/components/Tag'
import { Progress } from '@/components/Progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { MiniTimeline } from './MiniTimeline'
import { SessaoModal } from './SessaoModal'
import { useState } from 'react'

export default function HojePage() {
  const { data: disciplinas = [], isLoading: dLoading } = useDisciplinas()
  const { data: questoes = [] } = useQuestoes()
  const { data: erros = [] } = useErros()
  const { data: revisoes = [] } = useRevisoes()
  const { data: sessoes = [] } = useSessoes()
  const { data: simulados = [] } = useSimulados()
  const { data: config } = useConfig()
  const [showSessao, setShowSessao] = useState(false)

  if (dLoading || !config) return <HojeSkeleton />

  const p = calcReadiness(disciplinas, questoes, revisoes, sessoes, simulados)
  const tg = taxaGeral(questoes)
  const ind = indic(tg)
  const cob = cobertura(disciplinas)
  const pend = revPend(revisoes)
  const fila = ciclo(disciplinas, questoes, erros, revisoes, 4)
  const hojeMin = horasHoje(sessoes)
  const meta = config.meta_diaria
  const st = streak(sessoes)
  const dp = diasProva(config.exam_date)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 pb-16">
      <p className="text-2xl mb-0.5">🎯</p>
      <h1 className="text-2xl font-bold tracking-tight mb-0.5">Hoje</h1>
      <p className="text-sm text-muted-foreground mb-6">{fmtFull(today())}</p>

      {/* Hero grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Tarefas do dia */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Prioridades do dia</span>
            <Tag color={hojeMin >= meta ? 'green' : 'gray'}>
              {(hojeMin / 60).toFixed(1)}h / {(meta / 60).toFixed(1)}h
            </Tag>
          </div>
          <Progress value={clamp(hojeMin / meta * 100, 0, 100)} className="mb-4"
            color="var(--tag-green)" />
          <ul className="space-y-2 text-sm">
            {fila.map((f) => (
              <li key={f.disc} className="flex items-center gap-2 text-muted-foreground">
                <span className={`w-1.5 h-1.5 rounded-full flex-none ${f.pesada ? 'bg-[var(--tag-red)]' : 'bg-[var(--tag-blue)]'}`} />
                Estudar {f.disc}
              </li>
            ))}
            {pend.slice(0, 2).map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full flex-none bg-[var(--tag-green)]" />
                Revisar {r.assunto ?? r.disciplina}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => setShowSessao(true)}>+ Sessão de questões</Button>
          </div>
        </div>

        {/* Readiness */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Readiness Score</span>
            <Tag color={p.zona.color}>{p.zona.label}</Tag>
          </div>
          <div className="flex items-center gap-4">
            <Ring score={p.score} color={p.zona.color} size={88} />
            <div className="flex-1 space-y-2">
              {p.dims.map((d) => (
                <div key={d.k} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-20">{d.k}</span>
                  <Progress value={d.v} className="flex-1" />
                  <span className="text-[11px] font-mono w-6 text-right">{d.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { l: 'Edital', v: `${cob.pct.toFixed(0)}%`, s: `${cob.dom} dom.` },
          { l: 'Questões', v: questoes.reduce((a, q) => a + q.total, 0), s: `${questoes.length} sessões` },
          { l: 'Acertos', v: tg == null ? '—' : `${tg.toFixed(0)}%`, s: ind.label, c: ind.color },
          { l: 'Simulados', v: simulados.length, s: simulados.length ? `${(simulados.at(-1)!.acertos / simulados.at(-1)!.total * 100).toFixed(0)}% último` : 'nenhum' },
          { l: 'Sequência', v: `${st}d`, s: dp != null ? `${dp} dias p/ prova` : '—' },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border bg-card px-3 py-3">
            <p className="text-[11px] text-muted-foreground font-medium">{k.l}</p>
            <p className={`text-xl font-bold mt-1 tabular-nums ${k.c ? `text-[var(--tag-${k.c})]` : ''}`}>{k.v}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{k.s}</p>
          </div>
        ))}
      </div>

      {/* Mini-timeline */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">Cronograma · 14 Semanas</p>
        <a href="/timeline" className="text-xs text-primary hover:underline">Abrir →</a>
      </div>
      <MiniTimeline disciplinas={disciplinas} questoes={questoes} erros={erros} revisoes={revisoes} sessoes={sessoes} config={config} />

      {showSessao && <SessaoModal disciplinas={disciplinas.map(d => d.nome)} onClose={() => setShowSessao(false)} />}
    </div>
  )
}

function HojeSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
      <div className="grid grid-cols-5 gap-3">
        {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    </div>
  )
}
