'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Questao } from '@/lib/domain/types'

const KEY = ['questoes']
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
        if (error.code === '42703') {
          const { error: e2 } = await supabase.from('questoes').insert({ ...base, user_id: user.id })
          if (e2) throw e2
        } else {
          throw error
        }
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
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
