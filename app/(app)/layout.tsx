import AppShell from '@/components/AppShell'
import { CommandPalette } from '@/components/CommandPalette'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()
    const { count } = await supabase
      .from('disciplinas')
      .select('id', { count: 'exact', head: true })

    if (count === 0) {
      await supabase.rpc('seed_edital')
    }
  } catch {
    // silently ignore — middleware already guarantees auth
  }

  return (
    <AppShell>
      <CommandPalette />
      {children}
    </AppShell>
  )
}
