export const SRS_INTERVALS = [1, 7, 15, 30, 60] as const

export const STATUS_ASSUNTO = {
  nao: { label: 'Não estudado', color: 'gray' },
  andamento: { label: 'Em andamento', color: 'blue' },
  dominado: { label: 'Dominado', color: 'green' },
  critico: { label: 'Crítico', color: 'red' },
} as const

export type StatusAssunto = keyof typeof STATUS_ASSUNTO

export const STATUS_DISCIPLINA = [
  'Não iniciada',
  'Em andamento',
  'Em revisão',
  'Concluída',
] as const

export type StatusDisciplina = (typeof STATUS_DISCIPLINA)[number]

export const PRIORIDADES = ['Alta', 'Média', 'Baixa'] as const
export type Prioridade = (typeof PRIORIDADES)[number]

export const PRIORIDADE_COLOR: Record<Prioridade, string> = {
  Alta: 'red',
  Média: 'yellow',
  Baixa: 'gray',
}

export const STATUS_DISCIPLINA_COLOR: Record<StatusDisciplina, string> = {
  'Não iniciada': 'gray',
  'Em andamento': 'blue',
  'Em revisão': 'yellow',
  Concluída: 'green',
}

export const TIPOS_ERRO = [
  'Falta de Atenção',
  'Desconhecimento da Matéria',
  'Interpretação de Texto',
  'Confusão entre Conceitos',
  'Decoreba',
  'Gestão de Tempo',
  'Erro Recorrente',
] as const

export type TipoErro = (typeof TIPOS_ERRO)[number]

export const DISCIPLINAS_PESADAS = new Set([
  'Direito Penal',
  'Direito Processual Penal',
  'Legislação Penal Especial',
  'Direito Constitucional',
  'Direito Administrativo',
  'Medicina Legal',
])
