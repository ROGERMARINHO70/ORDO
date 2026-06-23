import { today } from '@/lib/date'
import { cobertura, taxaGeral, revPend, rankFraq, streak, diasProva, statDisc } from './stats'
import { calcReadiness } from './readiness'
import { DISCIPLINAS_PESADAS } from './enums'
import type { Disciplina, Questao, Revisao, Sessao, Simulado, Erro } from './types'

export interface Alerta {
  c: string
  i: string
  t: string
  d: string
}

export function gerarAlertas(
  disciplinas: Disciplina[],
  questoes: Questao[],
  revisoes: Revisao[],
  sessoes: Sessao[],
  simulados: Simulado[],
  erros: Erro[],
  examDate: string
): Alerta[] {
  const out: Alerta[] = []
  const p = calcReadiness(disciplinas, questoes, revisoes, sessoes, simulados)
  const cob = cobertura(disciplinas)
  const venc = revPend(revisoes)
  const fraq = rankFraq(erros)
  const dp = diasProva(examDate)
  const st = streak(sessoes)

  if (p.zona.color === 'red')
    out.push({ c: 'red', i: '⚠', t: 'Prontidão em zona vermelha',
      d: `Índice em ${p.score}%. Priorize cobrir o edital de maior peso e elevar a taxa de acertos antes de abrir conteúdo novo.` })

  if (venc.length >= 5)
    out.push({ c: 'red', i: '↻', t: `${venc.length} revisões atrasadas`,
      d: 'Revisões em atraso derrubam a retenção. Limpe a fila começando pelas mais antigas.' })
  else if (venc.length)
    out.push({ c: 'blue', i: '↻', t: `${venc.length} revisão(ões) para hoje`,
      d: 'Conclua em Revisões para manter a curva do esquecimento sob controle.' })

  if (fraq.length) {
    const f = fraq[0]
    out.push({ c: 'yellow', i: '◎', t: `Maior fraqueza: ${f.assunto ?? f.disciplina}`,
      d: `${f.count} erro(s)${f.rec ? ` · ${f.rec} recorrente(s)` : ''} em ${f.disciplina}. Vale um bloco dedicado + 10 questões esta semana.` })
  }

  disciplinas.forEach((d) => {
    const s = statDisc(d.nome, questoes, erros)
    if (s.total >= 10 && s.taxa !== null && s.taxa < 60)
      out.push({ c: 'red', i: '▾', t: `${d.nome} em estado crítico`,
        d: `Taxa de ${s.taxa.toFixed(0)}% em ${s.total} questões. Reforce teoria antes de seguir.` })
  })

  disciplinas.forEach((d) => {
    if (DISCIPLINAS_PESADAS.has(d.nome) && (d.assuntos ?? []).length && (d.assuntos ?? []).every((a) => a.status === 'nao'))
      out.push({ c: 'yellow', i: '▸', t: `${d.nome} ainda sem início`,
        d: `Peso ${d.peso} e nenhum tópico iniciado. Suba no ciclo.` })
  })

  if (st === 0 && sessoes.length)
    out.push({ c: 'red', i: '!', t: 'Sequência interrompida',
      d: 'Você quebrou a constância. Registre uma sessão hoje, mesmo curta.' })

  if (st >= 7)
    out.push({ c: 'green', i: '✓', t: `${st} dias seguidos`,
      d: 'Constância move o índice mais que qualquer coisa. Mantenha.' })

  if (dp !== null && dp < 90 && cob.domPct < 50)
    out.push({ c: 'red', i: '⏱', t: `${dp} dias para a prova`,
      d: `Só ${cob.domPct.toFixed(0)}% do edital dominado. Feche os tópicos de maior peso e revise o já visto.` })

  if (!out.length)
    out.push({ c: 'green', i: '✓', t: 'Sem alertas críticos',
      d: 'Registre questões, erros e sessões para o assistente calibrar as recomendações.' })

  return out.slice(0, 7)
}
