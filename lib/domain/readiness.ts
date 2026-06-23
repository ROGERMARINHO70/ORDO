import { clamp, today, addDays } from '@/lib/date'
import { cobertura, taxaGeral, revPend } from './stats'
import type { Disciplina, Questao, Revisao, Sessao, Simulado } from './types'

export interface DimScore {
  k: string
  v: number
}

export interface ReadinessResult {
  score: number
  zona: { label: string; color: string }
  dims: DimScore[]
}

export function calcReadiness(
  disciplinas: Disciplina[],
  questoes: Questao[],
  revisoes: Revisao[],
  sessoes: Sessao[],
  simulados: Simulado[]
): ReadinessResult {
  const cob = cobertura(disciplinas)
  const cobScore = clamp(cob.pct, 0, 100)

  const tg = taxaGeral(questoes)
  const acScore = tg == null ? 0 : clamp(tg, 0, 100)

  const rd = revisoes.filter((r) => r.concluida).length
  const rt = revisoes.length
  const venc = revPend(revisoes).length
  const revScore = rt
    ? clamp((rd / rt) * 100 - venc * 4, 0, 100)
    : questoes.length ? 0 : 55

  const rec = sessoes.filter((s) => {
    const d = new Date(s.data + 'T00:00:00')
    const t = new Date(today() + 'T00:00:00')
    return (t.getTime() - d.getTime()) / 86_400_000 <= 14
  })
  const dr = new Set(rec.map((s) => s.data)).size
  const freqScore = clamp((dr / 12) * 100, 0, 100)

  let evoScore = 50
  if (simulados.length) {
    const ord = [...simulados].sort((a, b) => a.data.localeCompare(b.data))
    const last = ord[ord.length - 1]
    const lp = last.total ? (last.acertos / last.total) * 100 : 0
    if (ord.length >= 2) {
      const prev = ord[ord.length - 2]
      const pp = prev.total ? (prev.acertos / prev.total) * 100 : 0
      evoScore = clamp(lp + (lp - pp) * 1.5, 0, 100)
    } else {
      evoScore = clamp(lp, 0, 100)
    }
  } else {
    evoScore = acScore ? clamp(acScore - 8, 0, 100) : 20
  }

  const dims: DimScore[] = [
    { k: 'Edital', v: Math.round(cobScore) },
    { k: 'Acertos', v: Math.round(acScore) },
    { k: 'Revisões', v: Math.round(revScore) },
    { k: 'Frequência', v: Math.round(freqScore) },
    { k: 'Simulados', v: Math.round(evoScore) },
  ]

  const weights = [0.25, 0.28, 0.16, 0.13, 0.18]
  const score = Math.round(dims.reduce((a, d, i) => a + d.v * weights[i], 0))

  const zona =
    score < 45
      ? { label: 'Risco alto', color: 'red' }
      : score < 70
        ? { label: 'Competitivo', color: 'yellow' }
        : { label: 'Forte candidato', color: 'green' }

  return { score, zona, dims }
}
