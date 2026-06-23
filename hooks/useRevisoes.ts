'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { today } from '@/lib/date'
import { gerarRevisoesSRS } from '@/lib/domain/srs'
import type { Revisao } from '@/lib/domain/types'

const KEY = ['revisoes']
const supabase = createClient()

export function useRevisoes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('revisoes').select('*').order('due_em')
      if (error) throw error
      return data as Revisao[]
    },
  })
}

export function useConcluirRevisao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('revisoes')
        .update({ concluida: true, concluida_em: today() })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Revisao[]>(KEY)
      qc.setQueryData<Revisao[]>(KEY, (old) =>
        old?.map((r) => (r.id === id ? { ...r, concluida: true, concluida_em: today() } : r))
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(KEY, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useReopenRevisao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('revisoes').update({ concluida: false, concluida_em: null }).eq('id', id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useCreateRevisao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      disciplina,
      assunto,
      dueEm,
      srs,
    }: { disciplina: string; assunto: string; dueEm: string; srs: boolean }) => {
      const user = (await supabase.auth.getUser()).data.user!
      const rows = srs
        ? gerarRevisoesSRS({ origem: 'manual', disciplina, assunto, base: dueEm }).map((r) => ({ ...r, user_id: user.id }))
        : [{ origem: 'manual', disciplina, assunto, etapa: 0, criada_em: today(), due_em: dueEm, concluida: false, user_id: user.id }]
      const { error } = await supabase.from('revisoes').insert(rows)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
