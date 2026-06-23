'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Simulado } from '@/lib/domain/types'

const KEY = ['simulados']
const supabase = createClient()

export function useSimulados() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('simulados').select('*').order('data')
      if (error) throw error
      return data as Simulado[]
    },
  })
}

export function useCreateSimulado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: Omit<Simulado, 'id'>) => {
      const user = (await supabase.auth.getUser()).data.user!
      const { error } = await supabase.from('simulados').insert({ ...row, user_id: user.id })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteSimulado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('simulados').delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
