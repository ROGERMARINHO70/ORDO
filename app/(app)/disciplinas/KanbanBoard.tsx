'use client'

import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core'
import { STATUS_DISCIPLINA } from '@/lib/domain/enums'
import { discProg } from '@/lib/domain/stats'
import { Progress } from '@/components/Progress'
import { Tag } from '@/components/Tag'
import type { Disciplina, Assunto } from '@/lib/domain/types'
import type { StatusDisciplina } from '@/lib/domain/enums'

const STATUS_COLOR: Record<StatusDisciplina, string> = {
  'Não iniciada': 'gray', 'Em andamento': 'blue', 'Em revisão': 'yellow', Concluída: 'green',
}

function assuntoColor(a: Assunto): string {
  if (a.status === 'dominado') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
  if (a.status === 'critico') return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
  if (a.status === 'andamento') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400'
  return 'bg-muted text-muted-foreground'
}

function openStudyModal(disc: string, assunto?: string) {
  window.dispatchEvent(
    new CustomEvent('open-study-modal', { detail: { disc, assunto } })
  )
}

interface Props {
  disciplinas: Disciplina[]
  onUpdate: (id: string, status: string) => void
  onPeek: (d: Disciplina) => void
}

function Column({ status, disciplinas, onPeek }: { status: StatusDisciplina; disciplinas: Disciplina[]; onPeek: (d: Disciplina) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div ref={setNodeRef} className={`w-72 shrink-0 rounded-xl border bg-muted/30 p-2.5 transition-colors ${isOver ? 'bg-primary/5 border-primary' : ''}`}>
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
  const assuntos = disc.assuntos ?? []

  // Sort: critico first, then andamento, then others
  const sorted = [...assuntos].sort((a, b) => {
    const order = { critico: 0, andamento: 1, dominado: 2, '': 3 }
    return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3)
  })
  const visible = sorted.slice(0, 5)
  const overflow = assuntos.length - visible.length

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onPeek(disc)}
      style={transform ? { transform: `translate(${transform.x}px,${transform.y}px)` } : undefined}
      className={`rounded-lg border bg-background p-3 mb-2 cursor-grab active:cursor-grabbing hover:border-muted-foreground transition-all ${isDragging ? 'opacity-40' : ''}`}
    >
      <p className="text-sm font-semibold mb-2">{disc.nome}</p>

      <div className="flex gap-1.5 flex-wrap mb-2.5">
        <Tag>peso {disc.peso}</Tag>
        <Tag color={disc.prioridade === 'Alta' ? 'red' : disc.prioridade === 'Média' ? 'yellow' : 'gray'}>{disc.prioridade}</Tag>
      </div>

      {visible.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {visible.map((a) => (
            <button
              key={a.id}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); openStudyModal(disc.nome, a.nome) }}
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity ${assuntoColor(a)}`}
              title={`Registrar sessão: ${a.nome}`}
            >
              {a.nome}
            </button>
          ))}
          {overflow > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full text-muted-foreground bg-muted">
              +{overflow}
            </span>
          )}
        </div>
      )}

      {/* Registrar sessão desta disciplina */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); openStudyModal(disc.nome) }}
        className="w-full text-[10px] text-muted-foreground hover:text-primary border border-dashed border-muted hover:border-primary rounded-md py-1 transition-colors mt-1"
      >
        + registrar sessão
      </button>

      <div className="flex items-center gap-2">
        <Progress value={pg} className="flex-1" />
        <span className="text-[10px] font-mono text-muted-foreground shrink-0">{pg.toFixed(0)}%</span>
      </div>
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
