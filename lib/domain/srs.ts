import { SRS_INTERVALS } from './enums'
import { addDays, today } from '@/lib/date'

export interface RevisaoInput {
  origem: string
  disciplina: string
  assunto?: string
  base?: string
}

/** Gera 5 revisões SRS (1·7·15·30·60d) a partir de uma data base */
export function gerarRevisoesSRS(input: RevisaoInput) {
  const base = input.base ?? today()
  return SRS_INTERVALS.map((dias, etapa) => ({
    origem: input.origem,
    disciplina: input.disciplina,
    assunto: input.assunto,
    etapa,
    criada_em: base,
    due_em: addDays(base, dias),
    concluida: false,
  }))
}
