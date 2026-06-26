'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  onMinutes: (mins: number) => void
}

export function StudyTimer({ onMinutes }: Props) {
  const [elapsed, setElapsed] = useState(0) // seconds
  const [running, setRunning] = useState(false)
  const ref = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } else {
      clearInterval(ref.current)
    }
    return () => clearInterval(ref.current)
  }, [running])

  function stop() {
    setRunning(false)
    const mins = Math.max(1, Math.round(elapsed / 60))
    onMinutes(mins)
    setElapsed(0)
  }

  function reset() {
    setRunning(false)
    setElapsed(0)
    onMinutes(0)
  }

  const hh = Math.floor(elapsed / 3600)
  const mm = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0')
  const ss = (elapsed % 60).toString().padStart(2, '0')
  const display = hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`

  const mins = Math.floor(elapsed / 60)

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className={`text-4xl font-mono font-bold tabular-nums tracking-tight ${running ? 'text-primary' : 'text-foreground'}`}>
        {display}
      </div>

      <div className="flex items-center gap-2">
        {!running && elapsed === 0 && (
          <Button size="sm" onClick={() => setRunning(true)} className="gap-1.5">
            ▶ Iniciar
          </Button>
        )}
        {running && (
          <Button size="sm" variant="outline" onClick={() => setRunning(false)} className="gap-1.5">
            ⏸ Pausar
          </Button>
        )}
        {!running && elapsed > 0 && (
          <>
            <Button size="sm" onClick={() => setRunning(true)} className="gap-1.5">
              ▶ Continuar
            </Button>
            <Button size="sm" variant="default" onClick={stop} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              ⏹ Usar {mins}min
            </Button>
            <Button size="sm" variant="ghost" onClick={reset} className="text-muted-foreground">
              Zerar
            </Button>
          </>
        )}
      </div>

      {elapsed > 0 && (
        <p className="text-xs text-muted-foreground">
          {mins} min registrado{mins !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
