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
      const { data, error } = await supabase
        .from('sessoes')
        .select('*')
        .order('data', { ascending: false })
      if (error) throw error
      return data as Sessao[]
    },
    // Poll every 5s as fallback in case cache invalidation misses
    refetchInterval: 5_000,
  })
}

export function useCreateSessao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: Omit<Sessao, 'id'>) => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Usuário não autenticado')
      // Schema only has: id, user_id, disciplina, minutos, data, created_at
      const { error } = await supabase.from('sessoes').insert({
        disciplina: row.disciplina,
        minutos: row.minutos,
        data: row.data,
        user_id: user.id,
      })
      if (error) throw error
    },
    // Optimistic update – adds the session to the cache immediately
    onMutate: async (newRow) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Sessao[]>(KEY)
      const optId = `opt-${Date.now()}`
      qc.setQueryData<Sessao[]>(KEY, (old) => [
        { id: optId, ...newRow },
        ...(old ?? []),
      ])
      return { prev, optId }
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
