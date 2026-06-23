'use client'

import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core'
import { STATUS_DISCIPLINA } from '@/lib/domain/enums'
import { discProg } from '@/lib/domain/stats'
import { Progress } from '@/components/Progress'
import { Tag } from '@/components/Tag'
import type { Disciplina } from '@/lib/domain/types'
import type { StatusDisciplina } from '@/lib/domain/enums'

const STATUS_COLOR: Record<StatusDisciplina, string> = {
  'Não iniciada': 'gray', 'Em andamento': 'blue', 'Em revisão': 'yellow', Concluída: 'green',
}

interface Props {
  disciplinas: Disciplina[]
  onUpdate: (id: string, status: string) => void
  onPeek: (d: Disciplina) => void
}

function Column({ status, disciplinas, onPeek }: { status: StatusDisciplina; disciplinas: Disciplina[]; onPeek: (d: Disciplina) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div ref={setNodeRef} className={`w-64 shrink-0 rounded-xl border bg-muted/30 p-2.5 transition-colors ${isOver ? 'bg-primary/5 border-primary' : ''}`}>
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <span className={`w-2 h-2 rounded-full bg-[var(--tag-${STATUS_COLOR[status]})]`} />
        <span className="text-xs font-semibold">{status}</span>
        <span className="ml-auto text-xs font-mono text-muted-foreground">{disciplinas.length}</span>
      </div>
      {disciplinas.map(d => <KanbanCard key={d.id} disc={d} onPeek={onPeek} />)}
    </div>
  )
}

function KanbanCard({ disc, onPeek }: { disc: Disciplina; onPeek: (d: Disciplina) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: disc.id })
  const pg = discProg(disc)
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      onClick={() => onPeek(disc)}
      style={transform ? { transform: `translate(${transform.x}px,${transform.y}px)` } : undefined}
      className={`rounded-lg border bg-background p-2.5 mb-2 cursor-grab active:cursor-grabbing hover:border-muted-foreground transition-all ${isDragging ? 'opacity-40' : ''}`}>
      <p className="text-sm font-medium mb-2">{disc.nome}</p>
      <div className="flex gap-1.5 flex-wrap mb-2">
        <Tag>peso {disc.peso}</Tag>
        <Tag color={disc.prioridade === 'Alta' ? 'red' : disc.prioridade === 'Média' ? 'yellow' : 'gray'}>{disc.prioridade}</Tag>
      </div>
      <Progress value={pg} />
    </div>
  )
}

export function KanbanBoard({ disciplinas, onUpdate, onPeek }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function onDragEnd(e: DragEndEvent) {
    if (e.over) onUpdate(String(e.active.id), String(e.over.id))
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STATUS_DISCIPLINA.map(st => (
          <Column key={st} status={st} disciplinas={disciplinas.filter(d => d.status === st)} onPeek={onPeek} />
        ))}
      </div>
    </DndContext>
  )
}
