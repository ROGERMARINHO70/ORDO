'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Disciplina } from '@/lib/domain/types'
import type { StatusDisciplina, Prioridade } from '@/lib/domain/enums'

const KEY = ['disciplinas']
const supabase = createClient()

async function fetchDisciplinas(): Promise<Disciplina[]> {
  const { data, error } = await supabase
    .from('disciplinas')
    .select('*, assuntos(id,disciplina_id,nome,status,ordem)')
    .order('ordem')
    .order('ordem', { referencedTable: 'assuntos' })
  if (error) throw error
  return data as Disciplina[]
}

export function useDisciplinas() {
  return useQuery({ queryKey: KEY, queryFn: fetchDisciplinas })
}

export function useUpdateDisciplina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Disciplina> }) => {
      const { error } = await supabase.from('disciplinas').update(patch).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Disciplina[]>(KEY)
      qc.setQueryData<Disciplina[]>(KEY, (old) =>
        old?.map((d) => (d.id === id ? { ...d, ...patch } : d))
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(KEY, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useCreateDisciplina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { nome: string; peso: number; prioridade: Prioridade }) => {
      const user = (await supabase.auth.getUser()).data.user!
      const { error } = await supabase.from('disciplinas').insert({ ...data, user_id: user.id })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
