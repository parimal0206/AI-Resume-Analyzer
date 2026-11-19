import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  BookOpen, ExternalLink, ArrowLeft, TrendingUp,
  Award, Zap, Brain, GraduationCap
} from 'lucide-react'
import { resumeApi, jobApi } from '../services/api'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

interface SkillGapItem {
  skill: string
  demand_frequency: number
  importance: string
  suggested_resources: { name: string; type: string; link: string }[]
}

export default function SkillGapPage() {
  const navigate = useNavigate()
  const [resumes, setResumes] = useState<{id: number; title: string}[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)
  const [skillGaps, setSkillGaps] = useState<SkillGapItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await resumeApi.list()
        setResumes(res.data)
        if (res.data.length > 0) setSelectedResumeId(res.data[0].id)
      } catch (err) {
        console.error('Failed to fetch resumes', err)
      }
    }
    fetchResumes()
  }, [])

  useEffect(() => {
    if (selectedResumeId) {
      fetchSkillGaps()
    }
  }, [selectedResumeId])

  const fetchSkillGaps = async () => {
    if (!selectedResumeId) return
    setLoading(true)
    setError('')
    try {
      const res = await jobApi.skillGap(selectedResumeId)
      setSkillGaps(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load skill gap report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">Skill Gap Analysis</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Skill Gap Report</h1>
              <p className="text-muted-foreground mt-1">
                Based on your top job matches, here are the skills you're missing ranked by market demand.
              </p>
            </div>
            {resumes.length > 0 && (
              <select
                value={selectedResumeId || ''}
                onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                className="flex h-10 w-full max-w-xs items-center rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            )}
          </div>

          {resumes.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Brain className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Resumes Found</h3>
                <p className="text-muted-foreground mb-4">Upload a resume to generate your personalized skill gap report.</p>
                <Link to="/upload">
                  <Button className="gap-2">
                    <Zap className="h-4 w-4" />
                    Upload Resume
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-4 bg-muted rounded w-1/2 mb-3" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="py-6 text-center text-red-600 dark:text-red-400">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {!loading && !error && skillGaps.length > 0 && (
          <div className="space-y-4">
            {skillGaps.map((gap, index) => (
              <Card key={gap.skill} className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{gap.skill}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Demand: {gap.demand_frequency} of top 10 matches
                          </span>
                          <Badge variant={gap.importance === 'High' ? 'destructive' : 'warning'} className="text-xs">
                            {gap.importance} Priority
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {gap.suggested_resources.map((resource, i) => (
                        <a
                          key={i}
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                          style={{
                            backgroundColor: resource.type === 'Free' ? 'var(--green-100)' : 'var(--blue-100)',
                            color: resource.type === 'Free' ? 'var(--green-800)' : 'var(--blue-800)',
                            borderColor: resource.type === 'Free' ? 'var(--green-300)' : 'var(--blue-300)',
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {resource.name}
                          <Badge variant="outline" className="text-[10px] px-1.5">{resource.type}</Badge>
                        </a>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && skillGaps.length === 0 && resumes.length > 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Significant Skill Gaps!</h3>
              <p className="text-muted-foreground">
                Your skills align well with your target roles. Consider exploring advanced topics or adjacent skills.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Learning Resources Guide */}
        {!loading && !error && (
          <Card className="mt-8 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary-600" />
                Learning Resources Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { icon: BookOpen, title: 'Documentation', desc: 'Official docs are always free and up-to-date', color: 'blue' },
                  { icon: Brain, title: 'Interactive Courses', desc: 'Codecademy, freeCodeCamp, Coursera audits', color: 'purple' },
                  { icon: Zap, title: 'Build Projects', desc: 'Apply skills by building real portfolio projects', color: 'orange' },
                ].map((item) => (
                  <div key={item.title} className="p-4 rounded-lg bg-background border">
                    <div className="p-2 rounded-lg bg-{item.color}-100 dark:bg-{item.color}-900/30 mb-3">
                      <item.icon className="h-6 w-6 text-{item.color}-600" />
                    </div>
                    <h4 className="font-medium mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}