'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { statusKey } from '@/lib/plano'
import type { BlocoCronograma } from '@/lib/plano'

const KEY = ['cronograma_status']
const supabase = createClient()

interface StatusRow {
  dia: number
  bloco: string
  status: string
}

// Retorna Record<"dia:bloco", status> — ex: { "1:BLOCO #1": "feito" }
export function useCronograma() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cronograma_status')
        .select('dia, bloco, status')
      if (error) throw error
      const map: Record<string, string> = {}
      for (const row of (data as StatusRow[])) {
        map[`${row.dia}:${row.bloco}`] = row.status
      }
      return map
    },
  })
}

// Marca ou desmarca um bloco (status=null remove o registro)
export function useSetBlocoStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bloco,
      status,
    }: {
      bloco: BlocoCronograma
      status: 'feito' | 'pulado' | null
    }) => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Usuário não autenticado')

      if (status === null) {
        const { error } = await supabase
          .from('cronograma_status')
          .delete()
          .eq('user_id', user.id)
          .eq('dia', bloco.dia)
          .eq('bloco', bloco.bloco)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('cronograma_status')
          .upsert(
            {
              user_id: user.id,
              dia: bloco.dia,
              bloco: bloco.bloco,
              status,
              feito_em: status === 'feito' ? new Date().toISOString() : null,
            },
            { onConflict: 'user_id,dia,bloco' }
          )
        if (error) throw error
      }
    },
    onMutate: async ({ bloco, status }) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Record<string, string>>(KEY)
      const k = statusKey(bloco)
      qc.setQueryData<Record<string, string>>(KEY, old => {
        const next = { ...(old ?? {}) }
        if (status === null) {
          delete next[k]
        } else {
          next[k] = status
        }
        return next
      })
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(KEY, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
