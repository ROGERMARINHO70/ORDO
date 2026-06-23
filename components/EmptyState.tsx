import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  emoji?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ emoji = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-4xl mb-3">{emoji}</p>
      <p className="font-semibold text-foreground mb-1">{title}</p>
      {description && <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}
