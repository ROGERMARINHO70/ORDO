'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { addDays } from '@/lib/date'
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

      // Agendar UMA revisão em 7 dias se não houver pendente para este assunto
      const origem = `erro:${row.disciplina}:${row.assunto ?? ''}`
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
          assunto: row.assunto,
          etapa: 0,
          criada_em: row.data,
          due_em: addDays(row.data, 7),
          concluida: false,
        })
      }

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
