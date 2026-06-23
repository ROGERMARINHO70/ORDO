const COLOR_VAR: Record<string, string> = {
  green:  'var(--tag-green)',
  yellow: 'var(--tag-yellow)',
  red:    'var(--tag-red)',
  blue:   'var(--tag-blue)',
}

interface RingProps {
  score: number
  color: string
  size?: number
}

export function Ring({ score, color, size = 92 }: RingProps) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const stroke = COLOR_VAR[color] ?? COLOR_VAR.blue

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth="7" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      >
        <animate attributeName="stroke-dashoffset" from={circ} to={offset} dur=".8s" fill="freeze" />
      </circle>
      <text
        x="50%" y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--color-foreground)"
        fontSize={size * 0.26}
        fontWeight="700"
        fontFamily="var(--font-mono, monospace)"
      >
        {score}
      </text>
    </svg>
  )
}
