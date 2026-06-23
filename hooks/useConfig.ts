'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { UserConfig } from '@/lib/domain/types'

const KEY = ['config']
const supabase = createClient()

async function fetchConfig(): Promise<UserConfig> {
  const { data, error } = await supabase
    .from('user_config')
    .select('exam_name,exam_date,meta_diaria,dias_semana,theme')
    .single()
  if (error) throw error
  return data as UserConfig
}

export function useConfig() {
  return useQuery({ queryKey: KEY, queryFn: fetchConfig })
}

export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<UserConfig>) => {
      const { error } = await supabase.from('user_config').update(patch).eq(
        'user_id',
        (await supabase.auth.getUser()).data.user!.id
      )
      if (error) throw error
    },
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<UserConfig>(KEY)
      qc.setQueryData<UserConfig>(KEY, (old) => ({ ...old!, ...patch }))
      return { prev }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(KEY, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
