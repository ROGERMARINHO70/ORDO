'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDisciplinas } from '@/hooks/useDisciplinas'
import { useCreateQuestao } from '@/hooks/useQuestoes'
import { useCreateSessao } from '@/hooks/useSessoes'
import { StudyTimer } from '@/components/StudyTimer'
import { today } from '@/lib/date'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const TIPOS = [
  { id: 'teoria_video', label: 'Teoria Vídeo', emoji: '📺' },
  { id: 'teoria_pdf', label: 'Teoria PDF', emoji: '📄' },
  { id: 'revisao', label: 'Revisão', emoji: '♻️' },
  { id: 'resumo', label: 'Resumo', emoji: '📝' },
] as const

export interface StudyModalPreset {
  disc?: string
  assunto?: string
}

interface Props {
  preset?: StudyModalPreset
  onClose: () => void
}

export function StudyRegisterModal({ preset, onClose }: Props) {
  const { data: disciplinas = [] } = useDisciplinas()
  const criarQ = useCreateQuestao()
  const criarS = useCreateSessao()

  const [disc, setDisc] = useState(preset?.disc ?? disciplinas[0]?.nome ?? '')
  const [assunto, setAssunto] = useState(preset?.assunto ?? '')
  const [tipo, setTipo] = useState<string>('teoria_video')
  const [timerMode, setTimerMode] = useState<'manual' | 'timer'>('manual')
  const [horas, setHoras] = useState('0')
  const [mins, setMins] = useState('30')
  const [timerMins, setTimerMins] = useState(0)
  const [comQuestoes, setComQuestoes] = useState(false)
  const [total, setTotal] = useState('10')
  const [acertos, setAcertos] = useState('7')
  const [notas, setNotas] = useState('')

  const assuntosDaDisc = disciplinas.find((d) => d.nome === disc)?.assuntos ?? []
  const minutos = timerMode === 'manual'
    ? parseInt(horas || '0') * 60 + parseInt(mins || '0')
    : timerMins

  async function salvar() {
    if (!disc) { toast.error('Selecione a disciplina'); return }
    if (minutos <= 0) { toast.error('Informe o tempo estudado'); return }

    await criarS.mutateAsync({
      disciplina: disc,
      assunto: assunto || undefined,
      tipo,
      notas: notas.trim() || undefined,
      minutos,
      data: today(),
    })

    if (comQuestoes) {
      const t = parseInt(total)
      const a = Math.min(parseInt(acertos), t)
      if (t > 0) {
        await criarQ.mutateAsync({ disciplina: disc, total: t, acertos: a, tempo_medio: 0, data: today() })
      }
    }

    toast.success(`${minutos}min de ${disc} registrados!`)
    onClose()
  }

  const saving = criarS.isPending || criarQ.isPending

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Registrar Sessão de Estudo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Disciplina + Assunto */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">O que estudou?</label>
            <Select value={disc} onValueChange={(v) => { setDisc(v ?? ''); setAssunto('') }}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Disciplina" /></SelectTrigger>
              <SelectContent>
                {disciplinas.map((d) => <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            {assuntosDaDisc.length > 0 && (
              <Select value={assunto} onValueChange={(v) => setAssunto(v ?? '')}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Assunto específico (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum assunto específico</SelectItem>
                  {assuntosDaDisc.map((a) => <SelectItem key={a.id} value={a.nome}>{a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Tipo de estudo */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo de estudo</label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTipo(t.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors text-left',
                    tipo === t.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  )}
                >
                  <span>{t.emoji}</span>
                  <span className="text-xs">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tempo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tempo</label>
              <div className="flex rounded-lg border overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setTimerMode('manual')}
                  className={cn('px-3 py-1 transition-colors', timerMode === 'manual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setTimerMode('timer')}
                  className={cn('px-3 py-1 transition-colors', timerMode === 'timer' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                >
                  Cronômetro
                </button>
              </div>
            </div>

            {timerMode === 'manual' ? (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={horas}
                    onChange={(e) => setHoras(e.target.value)}
                    className="h-9 text-center text-sm"
                  />
                  <p className="text-[10px] text-center text-muted-foreground mt-0.5">horas</p>
                </div>
                <span className="text-muted-foreground text-lg font-bold pb-4">:</span>
                <div className="flex-1">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={mins}
                    onChange={(e) => setMins(e.target.value)}
                    className="h-9 text-center text-sm"
                  />
                  <p className="text-[10px] text-center text-muted-foreground mt-0.5">minutos</p>
                </div>
                {minutos > 0 && (
                  <span className="text-xs text-muted-foreground pb-4">= {minutos}min</span>
                )}
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/30 px-4 py-3">
                <StudyTimer onMinutes={setTimerMins} />
              </div>
            )}
          </div>

          {/* Questões (toggle) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={comQuestoes}
                onChange={(e) => setComQuestoes(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-primary"
              />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Incluir questões resolvidas
              </span>
            </label>
            {comQuestoes && (
              <div className="grid grid-cols-2 gap-2 pl-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <Input type="number" min={1} value={total} onChange={(e) => setTotal(e.target.value)} className="h-9" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Acertos</p>
                  <Input type="number" min={0} value={acertos} onChange={(e) => setAcertos(e.target.value)} className="h-9" />
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Observações <span className="font-normal normal-case">(opcional)</span>
            </label>
            <Textarea
              placeholder="Ex: Estudei páginas 10–35, revisar exercícios…"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
            />
          </div>

          {/* Ações */}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button onClick={salvar} disabled={saving || minutos <= 0}>
              {saving ? 'Salvando…' : `Salvar ${minutos > 0 ? minutos + 'min' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
