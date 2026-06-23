'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { gerarRevisoesSRS } from '@/lib/domain/srs'
import type { Erro } from '@/lib/domain/types'

const KEY = ['erros']
const REV_KEY = ['revisoes']
const supabase = createClient()

export function useErros() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('erros').select('*').order('data', { ascending: false })
      if (error) throw error
      return data as Erro[]
    },
  })
}

export function useCreateErro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: Omit<Erro, 'id' | 'resolvido'>) => {
      const user = (await supabase.auth.getUser()).data.user!
      const { data, error } = await supabase
        .from('erros')
        .insert({ ...row, resolvido: false, user_id: user.id })
        .select('id')
        .single()
      if (error) throw error
      // Agendar revisões SRS
      const revisoes = gerarRevisoesSRS({ origem: 'erro', disciplina: row.disciplina, assunto: row.assunto, base: row.data })
      await supabase.from('revisoes').insert(revisoes.map((r) => ({ ...r, user_id: user.id })))
      return data
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: REV_KEY })
    },
  })
}

export function useUpdateErro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Erro> }) => {
      const { error } = await supabase.from('erros').update(patch).eq('id', id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteErro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('erros').delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
