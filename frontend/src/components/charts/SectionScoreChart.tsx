import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { cn } from '../../lib/utils'

interface SectionScoreChartProps {
  data: Array<{ name: string; score: number; max: number }>
  className?: string
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#8b5cf6', '#ec4899']

export const SectionScoreChart = ({ data, className }: SectionScoreChartProps) => {
  const chartData = data.map((d, i) => ({
    ...d,
    percentage: Math.round((d.score / d.max) * 100),
    fill: COLORS[i % COLORS.length],
  }))

  return (
    <div className={cn('w-full h-64', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 500 }}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value}%`, '']}
          />
          <Bar dataKey="percentage" radius={[0, 4, 4, 0]} maxBarSize={30}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}