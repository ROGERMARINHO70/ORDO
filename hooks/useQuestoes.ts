'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { addDays, today } from '@/lib/date'
import type { Questao } from '@/lib/domain/types'

const KEY = ['questoes']
const REV_KEY = ['revisoes']
const supabase = createClient()

export function useQuestoes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('questoes').select('*').order('data', { ascending: false })
      if (error) throw error
      return data as Questao[]
    },
  })
}

export function useCreateQuestao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: Omit<Questao, 'id'>) => {
      const user = (await supabase.auth.getUser()).data.user!
      const { assunto, ...base } = row
      const { error } = await supabase.from('questoes').insert({ ...row, user_id: user.id })
      if (error) {
        // 42703 = coluna desconhecida (PostgreSQL), PGRST204 = coluna fora do schema cache (PostgREST)
        if (error.code === '42703' || error.code === 'PGRST204') {
          const { error: e2 } = await supabase.from('questoes').insert({ ...base, user_id: user.id })
          if (e2) throw e2
        } else {
          throw error
        }
      }

      // Se acerto < 75% → agendar revisão em 7 dias (deduplicado por assunto)
      if (row.total > 0 && row.acertos / row.total < 0.75) {
        const origem = `questao:${row.disciplina}:${row.assunto ?? ''}`
        const { data: existing } = await supabase
          .from('revisoes')
          .select('id')
          .eq('user_id', user.id)
          .eq('origem', origem)
          .eq('concluida', false)
          .limit(1)

        if (!existing || existing.length === 0) {
          await supabase.from('revisoes').insert({
            user_id: user.id,
            origem,
            disciplina: row.disciplina,
            assunto: row.assunto ?? null,
            etapa: 0,
            criada_em: today(),
            due_em: addDays(today(), 7),
            concluida: false,
          })
        }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: REV_KEY })
    },
  })
}

export function useUpdateQuestao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Omit<Questao, 'id'>> & { id: string }) => {
      const { error } = await supabase.from('questoes').update(updates).eq('id', id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteQuestao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('questoes').delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
