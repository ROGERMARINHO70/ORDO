import AppShell from '@/components/AppShell'
import { CommandPalette } from '@/components/CommandPalette'

export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <CommandPalette />
      {children}
    </AppShell>
  )
}
