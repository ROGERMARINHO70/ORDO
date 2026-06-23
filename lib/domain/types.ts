import type { StatusAssunto, StatusDisciplina, Prioridade, TipoErro } from './enums'

export interface Assunto {
  id: string
  disciplina_id: string
  nome: string
  status: StatusAssunto
  ordem: number
}

export interface Disciplina {
  id: string
  nome: string
  peso: number
  status: StatusDisciplina
  prioridade: Prioridade
  ordem: number
  assuntos?: Assunto[]
}

export interface Questao {
  id: string
  disciplina: string
  total: number
  acertos: number
  tempo_medio: number
  data: string
}

export interface Erro {
  id: string
  disciplina: string
  assunto?: string
  tipo: TipoErro
  banca?: string
  dificuldade: number
  tempo?: number
  gabarito?: string
  justificativa?: string
  comentario?: string
  resolvido: boolean
  data: string
}

export interface Revisao {
  id: string
  origem: string
  disciplina: string
  assunto?: string
  etapa: number
  criada_em: string
  due_em: string
  concluida: boolean
  concluida_em?: string
}

export interface Simulado {
  id: string
  nome: string
  data: string
  total: number
  acertos: number
  por_disciplina: Record<string, { total: number; acertos: number }>
}

export interface Sessao {
  id: string
  disciplina: string
  minutos: number
  data: string
}

export interface UserConfig {
  exam_name: string
  exam_date: string
  meta_diaria: number
  dias_semana: number
  theme: 'light' | 'dark'
}
