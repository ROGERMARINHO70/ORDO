'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateQuestao } from '@/hooks/useQuestoes'
import { useCreateSessao } from '@/hooks/useSessoes'
import { today } from '@/lib/date'
import { toast } from 'sonner'

interface Props { disciplinas: string[]; onClose: () => void }

export function SessaoModal({ disciplinas, onClose }: Props) {
  const [disc, setDisc] = useState(disciplinas[0] ?? '')
  const [total, setTotal] = useState('10')
  const [acertos, setAcertos] = useState('7')
  const [minutos, setMinutos] = useState('30')
  const [data, setData] = useState(today())
  const criarQ = useCreateQuestao()
  const criarS = useCreateSessao()

  async function salvar() {
    const t = parseInt(total)
    const a = Math.min(parseInt(acertos), t)
    if (!t || t <= 0) { toast.error('Informe o total'); return }
    await criarQ.mutateAsync({ disciplina: disc, total: t, acertos: a, tempo_medio: 0, data })
    const m = parseInt(minutos)
    if (m > 0) await criarS.mutateAsync({ disciplina: disc, minutos: m, data })
    toast.success('Sessão registrada')
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Sessão de questões</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-1">
          <Select value={disc} onValueChange={v => setDisc(v ?? "")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{disciplinas.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground">Total</label><Input type="number" min={1} value={total} onChange={e => setTotal(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Acertos</label><Input type="number" min={0} value={acertos} onChange={e => setAcertos(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground">Minutos</label><Input type="number" min={1} value={minutos} onChange={e => setMinutos(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Data</label><Input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={salvar} disabled={criarQ.isPending}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
