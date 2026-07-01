import raw from './plano139.json'

// ── Types ──────────────────────────────────────────────────────────────────────

export type TipoBloco =
  | 'Teoria'
  | 'Teoria 2ª passada'
  | 'Questões'
  | 'Questões intensivas'
  | 'Questões dirigidas'
  | 'Revisão Semanal'
  | 'Revisão Mensal'
  | 'Revisão Bimestral'
  | 'Revisão de resumos'
  | 'Simulado'
  | 'Descanso'

export type Prioridade = 'ALTA' | 'MÉDIA' | 'BAIXA'
export type Classe = 'A' | 'B' | 'C'

export interface BlocoCronograma {
  dia: number
  data: string       // 'YYYY-MM-DD'
  diaSem: string
  fase: string
  bloco: string      // 'BLOCO #1' | 'REV. SEMANAL' | 'DESCANSO ATIVO' | ...
  disciplina: string
  assunto: string
  tipo: TipoBloco
  tempo: number      // minutos
  prioridade: Prioridade
}

export interface SemanaPlano {
  semana: string     // 'Semana 1'
  periodo: string    // '01/07 a 07/07'
  fase: string       // '1 - Fundação'
  metaHoras: number  // 25
}

export interface PlanoDisciplina {
  disciplina: string
  classe: Classe
  horasPlanejadas: number
  freq: number
}

export interface CicloBaseItem {
  pos: string       // '#1' … '#30'
  disciplina: string
  classe: string    // 'Classe A' | 'Classe B' | 'Classe C'
  tempo: number
}

export interface Plano {
  meta: {
    metodo: string
    inicio: string   // '2026-07-01'
    prova: string    // '2026-11-22'
    fimPlano: string // '2026-11-16'
    totalDias: number
    semanas: number
    metaSemanalHoras: number
    blocoMin: number
    diasBufferAntesProva: number
    revisoes: {
      semanal: { dia: string; min: number }
      mensal: { cadaDias: number; min: number; tecnica: string }
      bimestral: { cadaDias: number; min: number; tecnica: string }
    }
  }
  classes: Record<string, string>
  disciplinas: PlanoDisciplina[]
  cicloBase: CicloBaseItem[]
  semanas: SemanaPlano[]
  cronograma: BlocoCronograma[]
}

// ── Helpers internos ───────────────────────────────────────────────────────────

// Parseia '01/07 a 07/07' → ['2026-07-01', '2026-07-07']
export function parsePeriodo(periodo: string): [string, string] {
  const [s, e] = periodo.split(' a ')
  const [sd, sm] = s.split('/')
  const [ed, em] = e.split('/')
  const y = '2026'
  return [`${y}-${sm}-${sd}`, `${y}-${em}-${ed}`]
}

export const TIPOS_ESTUDO = new Set<TipoBloco>([
  'Teoria', 'Teoria 2ª passada', 'Questões', 'Questões intensivas',
  'Questões dirigidas', 'Revisão Semanal', 'Revisão Mensal',
  'Revisão Bimestral', 'Revisão de resumos', 'Simulado',
])

// ── API pública ────────────────────────────────────────────────────────────────

export function getPlano(): Plano {
  return raw as Plano
}

export function blocosDoDia(data: string): BlocoCronograma[] {
  return getPlano().cronograma.filter(b => b.data === data)
}

export function semanaAtual(hoje: string): SemanaPlano | undefined {
  return getPlano().semanas.find(s => {
    const [start, end] = parsePeriodo(s.periodo)
    return hoje >= start && hoje <= end
  })
}

export function faseAtual(data: string): string | undefined {
  return blocosDoDia(data)[0]?.fase ?? semanaAtual(data)?.fase
}

// Chave única para um bloco no mapa de status: "dia:bloco" ex: "1:BLOCO #1"
export function statusKey(b: Pick<BlocoCronograma, 'dia' | 'bloco'>): string {
  return `${b.dia}:${b.bloco}`
}

// Próximo bloco de estudo pendente (exclui Descanso)
export function proximoBlocoPendente(
  status: Record<string, string>
): BlocoCronograma | undefined {
  return getPlano().cronograma.find(
    b => TIPOS_ESTUDO.has(b.tipo) && status[statusKey(b)] !== 'feito'
  )
}

// Horas de estudo feitas na semana que contém `hoje` (exclui Descanso)
export function horasDaSemana(
  hoje: string,
  status: Record<string, string>
): number {
  const sem = semanaAtual(hoje)
  if (!sem) return 0
  const [start, end] = parsePeriodo(sem.periodo)
  const mins = getPlano()
    .cronograma
    .filter(b => b.data >= start && b.data <= end && TIPOS_ESTUDO.has(b.tipo) && status[statusKey(b)] === 'feito')
    .reduce((acc, b) => acc + b.tempo, 0)
  return mins / 60
}
