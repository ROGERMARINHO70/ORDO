'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { StatusAssunto } from '@/lib/domain/enums'
import { gerarRevisoesSRS } from '@/lib/domain/srs'

const DISC_KEY = ['disciplinas']
const supabase = createClient()

export function useUpdateAssunto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      disciplinaNome,
      assuntoNome,
    }: {
      id: string
      status: StatusAssunto
      disciplinaNome: string
      assuntoNome: string
    }) => {
      const { error } = await supabase.from('assuntos').update({ status }).eq('id', id)
      if (error) throw error

      if (status === 'dominado') {
        const user = (await supabase.auth.getUser()).data.user!
        const revisoes = gerarRevisoesSRS({ origem: 'edital', disciplina: disciplinaNome, assunto: assuntoNome })
        const rows = revisoes.map((r) => ({ ...r, user_id: user.id }))
        await supabase.from('revisoes').insert(rows)
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: DISC_KEY }),
  })
}

export function useCreateAssunto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ disciplina_id, nome }: { disciplina_id: string; nome: string }) => {
      const user = (await supabase.auth.getUser()).data.user!
      const { error } = await supabase.from('assuntos').insert({ disciplina_id, nome, user_id: user.id })
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: DISC_KEY }),
  })
}
