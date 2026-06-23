const MES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'] as const

export const today = (): string => new Date().toISOString().slice(0, 10)

export const addDays = (date: string, n: number): string => {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export const between = (a: string, b: string): number =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)

export const fmt = (d: string | null | undefined): string => {
  if (!d) return '—'
  const x = new Date(d + 'T00:00:00')
  return `${x.getDate()} ${MES[x.getMonth()]}`
}

export const fmtFull = (d: string): string => {
  const x = new Date(d + 'T00:00:00')
  return `${x.getDate()} ${MES[x.getMonth()]} ${x.getFullYear()}`
}

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v))

export const startOfWeekMonday = (date: string): string => {
  const d = new Date(date + 'T00:00:00')
  const dow = (d.getDay() + 6) % 7
  return addDays(date, -dow)
}
