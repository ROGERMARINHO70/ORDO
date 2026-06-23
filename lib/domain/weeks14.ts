import { addDays, fmt, today, clamp } from '@/lib/date'
import { ciclo } from './ciclo'
import type { Disciplina, Questao, Erro, Revisao, Sessao, UserConfig } from './types'

export interface WeekMilestone {
  label: string
  color: string
}

export interface Week {
  N: number
  ws: string
  we: string
  discs: string[]
  planRev: number
  exec: number
  plan: number
  mile: WeekMilestone | null
  isNow: boolean
  exam: boolean
}

export function weeks14(
  config: UserConfig,
  disciplinas: Disciplina[],
  questoes: Questao[],
  erros: Erro[],
  revisoes: Revisao[],
  sessoes: Sessao[]
): Week[] {
  const ex = config.exam_date
  const exD = new Date(ex + 'T00:00:00')
  const dow = (exD.getDay() + 6) % 7
  const exMon = addDays(ex, -dow)
  const start = addDays(exMon, -13 * 7)
  const fila = ciclo(disciplinas, questoes, erros, revisoes, 28)
  const out: Week[] = []

  for (let w = 0; w < 14; w++) {
    const ws = addDays(start, w * 7)
    const we = addDays(ws, 6)
    const N = w + 1
    const d0 = fila[(w * 2) % fila.length]?.disc ?? ''
    const d1 = fila[(w * 2 + 1) % fila.length]?.disc ?? ''
    const discs = [...new Set([d0, d1].filter(Boolean))]
    const planRev = revisoes.filter((r) => r.due_em >= ws && r.due_em <= we && !r.concluida).length
    const exec = sessoes.filter((s) => s.data >= ws && s.data <= we).reduce((a, s) => a + s.minutos, 0) / 60
    const plan = (config.meta_diaria * config.dias_semana) / 60

    let mile: WeekMilestone | null = null
    if (N === 1) mile = { label: 'Início do ciclo', color: 'blue' }
    if ([4, 8, 11].includes(N)) mile = { label: 'Simulado', color: 'purple' }
    if (N === 13) mile = { label: 'Simulado final', color: 'purple' }
    if (N === 14) mile = { label: 'PROVA · 20/10', color: 'red' }

    const td = today()
    out.push({ N, ws, we, discs, planRev, exec, plan, mile, isNow: td >= ws && td <= we, exam: N === 14 })
  }

  return out
}
