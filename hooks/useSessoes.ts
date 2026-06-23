'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Sessao } from '@/lib/domain/types'

const KEY = ['sessoes']
const supabase = createClient()

export function useSessoes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('sessoes').select('*').order('data', { ascending: false })
      if (error) throw error
      return data as Sessao[]
    },
  })
}

export function useCreateSessao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: Omit<Sessao, 'id'>) => {
      const user = (await supabase.auth.getUser()).data.user!
      const { error } = await supabase.from('sessoes').insert({ ...row, user_id: user.id })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
