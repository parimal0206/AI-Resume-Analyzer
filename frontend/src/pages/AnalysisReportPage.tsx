import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Download, ArrowLeft, Target, AlertTriangle, Lightbulb,
  Star, TrendingUp, FileText
} from 'lucide-react'
import { resumeApi } from '../services/api'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ATGauge } from '../components/charts/ATSGauge'
import { SectionScoreChart } from '../components/charts/SectionScoreChart'
import { getScoreColor } from '../lib/utils'

interface Analysis {
  overall_ats_score: number
  section_scores: Record<string, { score: number; max: number }>
  strengths: string[]
  weaknesses: string[]
  action_items: string[]
  rewritten_bullets: { original: string; improved: string }[]
  suggested_summary: string
  ai_insights: string
}

export default function AnalysisReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id) return
      try {
        const res = await resumeApi.getAnalysis(Number(id))
        setAnalysis(res.data)
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Try to trigger analysis
          try {
            await resumeApi.analyze(Number(id))
            const res = await resumeApi.getAnalysis(Number(id))
            setAnalysis(res.data)
          } catch {
            setError('Analysis not found. Please run analysis from dashboard.')
          }
        } else {
          setError('Failed to load analysis')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchAnalysis()
  }, [id])

  const handleDownload = () => {
    if (!analysis) return
    const content = `
AI Resume Analysis Report
=========================
Overall ATS Score: ${analysis.overall_ats_score}/100

Section Scores:
${Object.entries(analysis.section_scores).map(([key, val]) => `  ${key}: ${val.score}/${val.max}`).join('\n')}

Strengths:
${analysis.strengths.map(s => `  • ${s}`).join('\n')}

Weaknesses:
${analysis.weaknesses.map(w => `  • ${w}`).join('\n')}

Action Items:
${analysis.action_items.map(a => `  • ${a}`).join('\n')}

AI Suggested Summary:
${analysis.suggested_summary}

Rewritten Bullets:
${analysis.rewritten_bullets.map((b, i) => `${i + 1}. Original: ${b.original}\n   Improved: ${b.improved}`).join('\n\n')}

AI Insights:
${analysis.ai_insights}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resume-analysis-${id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <CardContent className="py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
            <h2 className="text-xl font-bold mb-2">Analysis Not Available</h2>
            <p className="text-muted-foreground mb-6">{error || 'No analysis data found for this resume.'}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sectionScores = Object.entries(analysis.section_scores).map(([name, val]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    score: val.score,
    max: val.max,
  }))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-foreground">AI Resume Analyzer</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Score Overview */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Overall ATS Score</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <ATGauge score={analysis.overall_ats_score} size={180} strokeWidth={14} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Grade</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(analysis.overall_ats_score)}`}>
                  {analysis.overall_ats_score >= 80 ? 'A' : analysis.overall_ats_score >= 60 ? 'B' : analysis.overall_ats_score >= 40 ? 'C' : 'D'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {analysis.overall_ats_score >= 80 ? 'Excellent' : analysis.overall_ats_score >= 60 ? 'Good' : analysis.overall_ats_score >= 40 ? 'Needs Work' : 'Poor'}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Priority</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <div className="text-center">
                <Badge variant={analysis.action_items.length > 3 ? 'destructive' : 'warning'} className="text-lg px-4 py-2">
                  {analysis.action_items.length > 3 ? 'High' : analysis.action_items.length > 1 ? 'Medium' : 'Low'}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">{analysis.action_items.length} action items</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Section Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <SectionScoreChart data={sectionScores} />
          </CardContent>
        </Card>

        {/* Detailed Sections */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Strengths */}
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <CardTitle>Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card>
            <CardHeader className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <CardTitle>Areas for Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.weaknesses.map((weakness, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-500" />
              <CardTitle>Prioritized Action Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {analysis.action_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 p-4 rounded-lg border">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400">
                      {i + 1}
                    </span>
                    <span className="text-sm pt-0.5">{item}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* AI Suggested Summary */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <CardTitle>AI-Generated Professional Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <p className="text-base leading-relaxed whitespace-pre-wrap">{analysis.suggested_summary || 'No summary generated.'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Rewritten Bullets */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <CardTitle>Rewritten Bullet Points (STAR Format)</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.rewritten_bullets.length > 0 ? (
                <div className="space-y-6">
                  {analysis.rewritten_bullets.map((bullet, i) => (
                    <div key={i} className="space-y-3 p-4 rounded-lg border">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Original</p>
                        <p className="text-sm text-muted-foreground italic">{bullet.original}</p>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Improved (Quantified)</p>
                        <p className="text-sm font-medium">{bullet.improved}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No bullet points to rewrite.</p>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary-500" />
              <CardTitle>AI Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{analysis.ai_insights}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="border-primary-200 dark:border-primary-800">
          <CardContent className="py-6 text-center">
            <h3 className="text-lg font-semibold mb-2">What's Next?</h3>
            <p className="text-muted-foreground mb-4">Use these insights to improve your resume and find better job matches.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/jobs">
                <Button className="gap-2">
                  <Target className="h-4 w-4" />
                  View Job Matches
                </Button>
              </Link>
              <Link to="/match">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Match to Job Description
                </Button>
              </Link>
              <Link to="/skill-gap">
                <Button variant="outline" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  View Skill Gap Report
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}