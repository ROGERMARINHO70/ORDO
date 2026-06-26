import { today, between, addDays, clamp } from '@/lib/date'
import type { Disciplina, Questao, Erro, Revisao, Sessao } from './types'

export interface DiscStats {
  total: number
  acertos: number
  erros: number
  taxa: number | null
  tempoMedio: number | null
  cadErros: number
}

export function statDisc(disc: string, questoes: Questao[], erros: Erro[]): DiscStats {
  const qs = questoes.filter((q) => q.disciplina === disc)
  const total = qs.reduce((a, q) => a + q.total, 0)
  const ac = qs.reduce((a, q) => a + q.acertos, 0)
  const tp = qs.reduce((a, q) => a + q.tempo_medio * q.total, 0)
  return {
    total,
    acertos: ac,
    erros: total - ac,
    taxa: total ? (ac / total) * 100 : null,
    tempoMedio: total ? tp / total : null,
    cadErros: erros.filter((e) => e.disciplina === disc).length,
  }
}

export interface Cobertura {
  tot: number
  dom: number
  and: number
  crit: number
  pct: number
  domPct: number
}

export function cobertura(disciplinas: Disciplina[]): Cobertura {
  let tot = 0, dom = 0, and = 0, crit = 0
  disciplinas.forEach((d) =>
    (d.assuntos ?? []).forEach((a) => {
      tot++
      if (a.status === 'dominado') dom++
      if (a.status === 'andamento') and++
      if (a.status === 'critico') crit++
    })
  )
  return {
    tot, dom, and, crit,
    pct: tot ? ((dom + and * 0.4) / tot) * 100 : 0,
    domPct: tot ? (dom / tot) * 100 : 0,
  }
}

export function discProg(disc: Disciplina): number {
  const t = (disc.assuntos ?? []).length
  return t ? ((disc.assuntos ?? []).filter((a) => a.status === 'dominado').length / t) * 100 : 0
}

export function horasDisc(disc: string, sessoes: Sessao[]): number {
  return sessoes.filter((s) => s.disciplina === disc).reduce((a, s) => a + s.minutos, 0) / 60
}

export function horasHoje(sessoes: Sessao[]): number {
  const t = today()
  return sessoes.filter((s) => (s.data ?? '').slice(0, 10) === t).reduce((a, s) => a + s.minutos, 0)
}

export function taxaGeral(questoes: Questao[]): number | null {
  const t = questoes.reduce((a, q) => a + q.total, 0)
  const ac = questoes.reduce((a, q) => a + q.acertos, 0)
  return t ? (ac / t) * 100 : null
}

export function streak(sessoes: Sessao[]): number {
  const dias = [...new Set(sessoes.map((s) => (s.data ?? '').slice(0, 10)))].filter(Boolean).sort().reverse()
  if (!dias.length) return 0
  const c = today()
  if (dias[0] !== c && dias[0] !== addDays(c, -1)) return 0
  let p = dias.includes(c) ? c : addDays(c, -1)
  let st = 0
  while (dias.includes(p)) { st++; p = addDays(p, -1) }
  return st
}

export function revPend(revisoes: Revisao[]): Revisao[] {
  const t = today()
  return revisoes.filter((r) => !r.concluida && (r.due_em ?? '').slice(0, 10) <= t)
}

export function indic(t: number | null): { label: string; color: string } {
  if (t == null) return { label: '—', color: 'gray' }
  if (t > 85) return { label: 'Excelente', color: 'green' }
  if (t >= 70) return { label: 'Bom', color: 'green' }
  if (t >= 60) return { label: 'Atenção', color: 'yellow' }
  return { label: 'Crítico', color: 'red' }
}

export function rankFraq(erros: Erro[]) {
  const m: Record<string, { chave: string; disciplina: string; assunto?: string; count: number; rec: number; abertos: number }> = {}
  erros.forEach((e) => {
    const k = e.disciplina + ' — ' + (e.assunto ?? 'Geral')
    if (!m[k]) m[k] = { chave: k, disciplina: e.disciplina, assunto: e.assunto, count: 0, rec: 0, abertos: 0 }
    m[k].count++
    if (e.tipo === 'Erro Recorrente') m[k].rec++
    if (!e.resolvido) m[k].abertos++
  })
  return Object.values(m).sort((a, b) => b.count + b.rec * 1.5 - (a.count + a.rec * 1.5))
}

export function freqErro(e: Erro, erros: Erro[]): number {
  return erros.filter((x) => x.disciplina === e.disciplina && (x.assunto ?? '') === (e.assunto ?? '')).length
}

export function padroesTipo(erros: Erro[]) {
  const m: Record<string, number> = {}
  erros.forEach((e) => { m[e.tipo] = (m[e.tipo] ?? 0) + 1 })
  return Object.entries(m).map(([k, v]) => ({ k, v })).filter((x) => x.v).sort((a, b) => b.v - a.v)
}

export function diasProva(examDate: string): number | null {
  return examDate ? between(today(), examDate) : null
}
