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

      // Always insert only the guaranteed base columns.
      // Columns assunto/tipo/notas may not exist until migration 001 is run.
      const payload: Record<string, unknown> = {
        disciplina: row.disciplina,
        minutos: row.minutos,
        data: row.data,
        user_id: user.id,
      }

      // Optimistically include extended columns only if they were explicitly set.
      // PostgREST ≥ 10 returns 42703 for unknown columns; we'll fall back if needed.
      if (row.assunto) payload.assunto = row.assunto
      if (row.tipo)    payload.tipo    = row.tipo
      if (row.notas)   payload.notas   = row.notas

      let { error } = await supabase.from('sessoes').insert(payload)

      if (error) {
        // Retry with only the three base columns (migration not yet applied)
        const { error: e2 } = await supabase.from('sessoes').insert({
          disciplina: row.disciplina,
          minutos: row.minutos,
          data: row.data,
          user_id: user.id,
        })
        if (e2) throw e2
      }
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
