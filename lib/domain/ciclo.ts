import { clamp } from '@/lib/date'
import { DISCIPLINAS_PESADAS } from './enums'
import { statDisc, revPend } from './stats'
import type { Disciplina, Questao, Erro, Revisao } from './types'

export interface FilaItem {
  disc: string
  score: number
  pesada: boolean
}

export function ciclo(
  disciplinas: Disciplina[],
  questoes: Questao[],
  erros: Erro[],
  revisoes: Revisao[],
  n = 10
): FilaItem[] {
  const venc = revPend(revisoes)

  const sc = disciplinas.map((d) => {
    const s = statDisc(d.nome, questoes, erros)
    const def = s.taxa == null ? 35 : clamp(100 - s.taxa, 0, 100)
    const ne = (d.assuntos ?? []).filter((a) => a.status === 'nao').length
    const cr = (d.assuntos ?? []).filter((a) => a.status === 'critico').length
    const rv = venc.filter((r) => r.disciplina === d.nome).length
    const pr = d.prioridade === 'Alta' ? 20 : d.prioridade === 'Média' ? 8 : 0
    return {
      disc: d.nome,
      score: d.peso * 14 + def * 0.5 + s.cadErros * 4 + ne * 3 + cr * 8 + rv * 10 + pr,
      pesada: DISCIPLINAS_PESADAS.has(d.nome),
    }
  }).sort((a, b) => b.score - a.score)

  const fila: FilaItem[] = []
  const pool = [...sc]

  while (fila.length < n && pool.length) {
    let i = pool.findIndex(
      (x) => !(fila.length && fila[fila.length - 1].pesada && x.pesada)
    )
    if (i < 0) i = 0
    fila.push(pool.splice(i, 1)[0])
    if (!pool.length && fila.length < n) pool.push(...sc)
  }

  return fila
}
