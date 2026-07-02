'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { today, addDays } from '@/lib/date'
import type { Revisao } from '@/lib/domain/types'
import type { BlocoCronograma } from '@/lib/plano'

const KEY = ['revisoes']
const supabase = createClient()

export function useRevisoes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('revisoes').select('*').order('due_em')
      if (error) throw error
      return data as Revisao[]
    },
  })
}

export function useConcluirRevisao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const user = (await supabase.auth.getUser()).data.user!

      // Busca a revisão para saber disciplina/assunto/origem/etapa
      const { data: rev } = await supabase.from('revisoes').select('*').eq('id', id).single()

      const { error } = await supabase
        .from('revisoes')
        .update({ concluida: true, concluida_em: today() })
        .eq('id', id)
      if (error) throw error

      // Agenda próxima revisão em 7 dias (erros, questões com < 75% e manuais)
      if (rev && (rev.origem?.startsWith('erro:') || rev.origem?.startsWith('manual:') || rev.origem?.startsWith('questao:'))) {
        const { data: existing } = await supabase
          .from('revisoes')
          .select('id')
          .eq('user_id', user.id)
          .eq('origem', rev.origem)
          .eq('concluida', false)
          .limit(1)

        if (!existing || existing.length === 0) {
          await supabase.from('revisoes').insert({
            user_id: user.id,
            origem: rev.origem,
            disciplina: rev.disciplina,
            assunto: rev.assunto,
            etapa: (rev.etapa ?? 0) + 1,
            criada_em: today(),
            due_em: addDays(today(), 7),
            concluida: false,
          })
        }
      }
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Revisao[]>(KEY)
      qc.setQueryData<Revisao[]>(KEY, (old) =>
        old?.map((r) => (r.id === id ? { ...r, concluida: true, concluida_em: today() } : r))
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(KEY, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useReopenRevisao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('revisoes').update({ concluida: false, concluida_em: null }).eq('id', id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

// Agendamento de revisões 1/7/30 dias para blocos Teoria do plano139.
// Usa origem = "plano:dia:bloco" como chave idempotente — ignora se já existe.
export function useAgendarRevisaoPlano() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (b: BlocoCronograma) => {
      const user = (await supabase.auth.getUser()).data.user!
      const origem = `plano:${b.dia}:${b.bloco}`

      const { data: existing } = await supabase
        .from('revisoes').select('id').eq('user_id', user.id).eq('origem', origem).limit(1)
      if (existing && existing.length > 0) return

      const rows = [1, 7, 30].map((dias, etapa) => ({
        user_id: user.id,
        origem,
        disciplina: b.disciplina,
        assunto: b.assunto,
        etapa,
        criada_em: b.data,
        due_em: addDays(b.data, dias),
        concluida: false,
      }))
      const { error } = await supabase.from('revisoes').insert(rows)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteRevisao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('revisoes').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Revisao[]>(KEY)
      qc.setQueryData<Revisao[]>(KEY, (old) => old?.filter((r) => r.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(KEY, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useCreateRevisao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      disciplina,
      assunto,
      dueEm,
    }: { disciplina: string; assunto: string; dueEm: string }) => {
      const user = (await supabase.auth.getUser()).data.user!
      const origem = `manual:${disciplina}:${assunto ?? ''}`
      const { error } = await supabase.from('revisoes').insert({
        user_id: user.id,
        origem,
        disciplina,
        assunto: assunto || null,
        etapa: 0,
        criada_em: today(),
        due_em: dueEm,
        concluida: false,
      })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
