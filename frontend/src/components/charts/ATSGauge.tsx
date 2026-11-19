import { clsx } from 'clsx'

interface ATGaugeProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
}

export const ATGauge = ({ score, size = 140, strokeWidth = 12, className }: ATGaugeProps) => {
  const getColor = (score: number) => {
    if (score >= 80) return '#22c55e' // green
    if (score >= 60) return '#eab308' // yellow
    if (score >= 40) return '#f97316' // orange
    return '#ef4444' // red
  }

  const color = getColor(score)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className={clsx('flex flex-col items-center', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text
          x={size / 2}
          y={size / 2}
          dominantBaseline="middle"
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="1rem"
          fontWeight="600"
        >
          ATS: {score}
        </text>
      </svg>
    </div>
  )
}