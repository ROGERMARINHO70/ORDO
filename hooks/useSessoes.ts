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
      const { assunto, tipo, notas, ...base } = row
      const { error } = await supabase.from('sessoes').insert({ ...row, user_id: user.id })
      if (error) {
        // code 42703 = column does not exist — migration not yet applied
        if (error.code === '42703') {
          const { error: e2 } = await supabase.from('sessoes').insert({ ...base, user_id: user.id })
          if (e2) throw e2
        } else {
          throw error
        }
      }
    },
    // Optimistic update — updates the cache immediately before the server responds
    onMutate: async (newRow) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Sessao[]>(KEY)
      const optimistic: Sessao = { id: `opt-${Date.now()}`, ...newRow }
      qc.setQueryData<Sessao[]>(KEY, (old) => [optimistic, ...(old ?? [])])
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(KEY, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteSessao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sessoes').delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
