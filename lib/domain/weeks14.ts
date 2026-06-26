import { addDays, today } from '@/lib/date'
import { ciclo } from './ciclo'
import type { Disciplina, Questao, Erro, Revisao, Sessao, UserConfig } from './types'

// Cronograma oficial: 12 semanas a partir de 29/06/2026 (segunda-feira após 26/06)
const STUDY_START = '2026-06-29'
export const TOTAL_WEEKS = 12

export interface WeekMilestone {
  label: string
  color: string
}

export interface WeekDay {
  date: string
  dow: number
  label: string
  disc: string
  sessMins: number
  isStudy: boolean
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
  days: WeekDay[]
}

const DOW_LABEL = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function milestone(N: number): WeekMilestone | null {
  if (N === 1) return { label: 'Início · 26/06', color: 'blue' }
  if (N === 4) return { label: 'Simulado', color: 'purple' }
  if (N === 8) return { label: 'Simulado', color: 'purple' }
  if (N === 11) return { label: 'Simulado final', color: 'purple' }
  if (N === 12) return { label: 'Revisão final', color: 'red' }
  return null
}

export function weeks14(
  config: UserConfig,
  disciplinas: Disciplina[],
  questoes: Questao[],
  erros: Erro[],
  revisoes: Revisao[],
  sessoes: Sessao[]
): Week[] {
  const totalStudyDays = TOTAL_WEEKS * config.dias_semana
  const fila = ciclo(disciplinas, questoes, erros, revisoes, Math.max(totalStudyDays, 28))
  const out: Week[] = []
  let studyDayIdx = 0
  const td = today()

  for (let w = 0; w < TOTAL_WEEKS; w++) {
    const ws = addDays(STUDY_START, w * 7)
    const we = addDays(ws, 6)
    const N = w + 1

    const days: WeekDay[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(ws, d)
      const isStudy = d < config.dias_semana
      const disc = isStudy ? (fila[studyDayIdx % fila.length]?.disc ?? '') : ''
      if (isStudy) studyDayIdx++
      const sessMins = sessoes
        .filter((s) => s.data === date)
        .reduce((a, s) => a + s.minutos, 0)
      days.push({ date, dow: d, label: DOW_LABEL[d], disc, sessMins, isStudy })
    }

    const studyDays = days.filter((d) => d.isStudy)
    const discs = [...new Set(studyDays.map((d) => d.disc).filter(Boolean))]
    const planRev = revisoes.filter((r) => r.due_em >= ws && r.due_em <= we && !r.concluida).length
    const exec = sessoes.filter((s) => s.data >= ws && s.data <= we).reduce((a, s) => a + s.minutos, 0) / 60
    const plan = (config.meta_diaria * config.dias_semana) / 60

    out.push({
      N, ws, we, discs, planRev, exec, plan,
      mile: milestone(N),
      isNow: td >= ws && td <= we,
      exam: false,
      days,
    })
  }

  return out
}
