'use client'

import { useDisciplinas } from '@/hooks/useDisciplinas'
import { useQuestoes } from '@/hooks/useQuestoes'
import { useErros } from '@/hooks/useErros'
import { useRevisoes } from '@/hooks/useRevisoes'
import { useSessoes } from '@/hooks/useSessoes'
import { useSimulados } from '@/hooks/useSimulados'
import { useConfig } from '@/hooks/useConfig'
import { gerarAlertas } from '@/lib/domain/intel'
import { ciclo } from '@/lib/domain/ciclo'
import { revPend } from '@/lib/domain/stats'
import { Tag } from '@/components/Tag'
import { Skeleton } from '@/components/ui/skeleton'

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export default function AssistentePage() {
  const { data: disciplinas = [], isLoading } = useDisciplinas()
  const { data: questoes = [] } = useQuestoes()
  const { data: erros = [] } = useErros()
  const { data: revisoes = [] } = useRevisoes()
  const { data: sessoes = [] } = useSessoes()
  const { data: simulados = [] } = useSimulados()
  const { data: config } = useConfig()

  if (isLoading || !config) return <Skeleton className="h-64 m-8 rounded-xl" />

  const alertas = gerarAlertas(disciplinas, questoes, revisoes, sessoes, simulados, erros, config.exam_date)
  const fila = ciclo(disciplinas, questoes, erros, revisoes, 7)
  const pend = revPend(revisoes)

  const plano = DIAS.map((dia, i) => {
    const tasks: { t: string; c: string }[] = []
    const c = fila[i % fila.length]
    if (c) tasks.push({ t: c.disc, c: c.pesada ? 'red' : 'blue' })
    const r = pend[i]
    if (r) tasks.push({ t: `Revisar ${r.assunto ?? r.disciplina}`, c: 'green' })
    if (i === 5) tasks.push({ t: 'Simulado', c: 'purple' })
    if (i === 6) tasks.push({ t: 'Revisão geral', c: 'green' })
    return { dia, tasks }
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pb-16">
      <p className="text-2xl mb-0.5">✨</p>
      <h1 className="text-2xl font-bold tracking-tight mb-0.5">Assistente de Aprovação</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Análise diária do cronograma, revisões, questões, simulados e caderno de erros.
      </p>

      {/* Briefing */}
      <div className="rounded-xl border bg-card p-4 mb-6 space-y-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Briefing do dia</p>
          <Tag>{erros.length} erros · {questoes.length} sessões</Tag>
        </div>
        {alertas.map((a, i) => (
          <div key={i} className="flex gap-3 py-3 border-t items-start">
            <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-[var(--tag-${a.c}-bg)] text-[var(--tag-${a.c})]`}>{a.i}</span>
            <div>
              <p className="text-sm font-semibold">{a.t}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plano da semana */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">Plano da semana</p>
        <Tag>reorganizado pelo desempenho</Tag>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {plano.map(({ dia, tasks }) => (
            <div key={dia} className="w-36 shrink-0 rounded-xl border bg-card p-3">
              <p className="text-xs font-semibold mb-2">{dia}</p>
              {tasks.length ? tasks.map((t, i) => (
                <div key={i} className={`text-[11px] mb-1.5 px-2 py-1 rounded border-l-2 bg-[var(--tag-${t.c}-bg)] border-[var(--tag-${t.c})] text-[var(--tag-${t.c})]`}>
                  {t.t}
                </div>
              )) : <p className="text-[11px] text-muted-foreground">Folga / leve</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
