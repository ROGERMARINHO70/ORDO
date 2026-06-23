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
      const { error } = await supabase.from('questoes').insert({ ...row, user_id: user.id })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
