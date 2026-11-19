import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  if (score >= 40) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-100 dark:bg-green-900/30'
  if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30'
  if (score >= 40) return 'bg-orange-100 dark:bg-orange-900/30'
  return 'bg-red-100 dark:bg-red-900/30'
}