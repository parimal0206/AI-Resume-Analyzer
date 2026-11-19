import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Plus, Target, FolderOpen, Briefcase,
  ChevronRight, Download, RefreshCw, LogOut, Menu, X
} from 'lucide-react'
import { useAuth } from '../store/auth'
import { resumeApi, jobApi, applicationApi } from '../services/api'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ATGauge } from '../components/charts/ATSGauge'
import { SectionScoreChart } from '../components/charts/SectionScoreChart'
import { formatDate } from '../lib/utils'

interface Resume {
  id: number
  title: string
  created_at: string
  ats_score?: number
}

interface Recommendation {
  id: number
  title: string
  company: string
  location: string
  match_percentage: number
  skill_match: { matched: string[]; missing: string[]; match_percentage: number }
  remote_type: string
}

interface Application {
  id: number
  title: string
  company: string
  status: string
  updated_at: string
}

export default function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth()

  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fetchData = async () => {
    try {
      const [resumesRes] = await Promise.all([
        resumeApi.list(),
      ])
      setResumes(resumesRes.data)
      if (resumesRes.data.length > 0 && !selectedResumeId) {
        setSelectedResumeId(resumesRes.data[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch resumes', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecommendations = async (resumeId: number) => {
    try {
      const res = await jobApi.recommend(resumeId, { limit: 5 })
      setRecommendations(res.data)
    } catch (err) {
      console.error('Failed to fetch recommendations', err)
    }
  }

  const fetchApplications = async () => {
    try {
      const res = await applicationApi.listApplications()
      setApplications(res.data)
    } catch (err) {
      console.error('Failed to fetch applications', err)
    }
  }

  useEffect(() => {
    fetchData()
    fetchApplications()
  }, [])

  useEffect(() => {
    if (selectedResumeId) {
      fetchRecommendations(selectedResumeId)
    }
  }, [selectedResumeId])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  const selectedResume = resumes.find(r => r.id === selectedResumeId)

  const statusColors: Record<string, string> = {
    saved: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    interview: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    offer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

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

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-sm font-medium text-foreground">Dashboard</Link>
              <Link to="/upload" className="text-sm font-medium text-muted-foreground hover:text-foreground">Upload Resume</Link>
              <Link to="/jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground">Job Board</Link>
              <Link to="/match" className="text-sm font-medium text-muted-foreground hover:text-foreground">JD Matcher</Link>
              <Link to="/skill-gap" className="text-sm font-medium text-muted-foreground hover:text-foreground">Skill Gap</Link>
              <Link to="/applications" className="text-sm font-medium text-muted-foreground hover:text-foreground">Applications</Link>
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-muted-foreground">
                {user?.full_name || user?.email}
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t space-y-2">
              <Link to="/dashboard" className="block px-2 py-2 text-sm font-medium text-foreground">Dashboard</Link>
              <Link to="/upload" className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground">Upload Resume</Link>
              <Link to="/jobs" className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground">Job Board</Link>
              <Link to="/match" className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground">JD Matcher</Link>
              <Link to="/skill-gap" className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground">Skill Gap</Link>
              <Link to="/applications" className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground">Applications</Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Resume Selector & Upload CTA */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <FileText className="h-6 w-6 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {resumes.length} resume{resumes.length !== 1 ? 's' : ''} uploaded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {resumes.length > 0 && (
              <select
                value={selectedResumeId || ''}
                onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                className="flex h-10 w-full max-w-xs items-center rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({formatDate(r.created_at)}){r.ats_score !== undefined ? ` - ATS: ${r.ats_score}` : ''}
                  </option>
                ))}
              </select>
            )}
            <Link to="/upload">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Upload Resume
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Resume Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {selectedResume ? (
              <>
                {/* ATS Score Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">ATS Score</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedResume.ats_score ? 'success' : 'secondary'}>
                        {selectedResume.ats_score !== undefined ? `${selectedResume.ats_score}/100` : 'Not Analyzed'}
                      </Badge>
                      {selectedResume.ats_score === undefined && (
                        <Button variant="outline" size="sm" onClick={async () => {
                          await resumeApi.analyze(selectedResume.id);
                          fetchData();
                        }}>
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Analyze
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedResume.ats_score !== undefined ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="flex justify-center">
                          <ATGauge score={selectedResume.ats_score} size={160} />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-4">Section Breakdown</h4>
                          <SectionScoreChart
                            data={[
                              { name: 'Skills', score: 24, max: 30 },
                              { name: 'Formatting', score: 16, max: 20 },
                              { name: 'Experience', score: 14, max: 20 },
                              { name: 'Education', score: 8, max: 10 },
                              { name: 'Metrics', score: 6, max: 10 },
                              { name: 'Clarity', score: 7, max: 10 },
                            ]}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-lg">No analysis yet</p>
                        <p className="text-sm mt-1">Click "Analyze" to get your ATS score and detailed feedback</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3">
                    <Link to={`/resume/${selectedResume.id}`} className="block">
                      <Button variant="outline" className="h-24 flex-col gap-2 justify-center w-full">
                        <Download className="h-6 w-6" />
                        <span>View Full Report</span>
                      </Button>
                    </Link>
                    <Link to="/jobs" className="block">
                      <Button variant="outline" className="h-24 flex-col gap-2 justify-center w-full">
                        <Target className="h-6 w-6" />
                        <span>Browse Jobs</span>
                      </Button>
                    </Link>
                    <Link to="/match" className="block">
                      <Button variant="outline" className="h-24 flex-col gap-2 justify-center w-full">
                        <Briefcase className="h-6 w-6" />
                        <span>Match to JD</span>
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-16">
                  <FileText className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Resumes Yet</h3>
                  <p className="text-muted-foreground mb-6">Upload your first resume to get started with AI analysis and job matching.</p>
                  <Link to="/upload">
                    <Button className="gap-2" size="lg">
                      <Plus className="h-4 w-4" />
                      Upload Resume
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Top Matches & Applications */}
          <div className="space-y-6">
            {/* Top Job Matches */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Top Matches</CardTitle>
                <Link to="/jobs" className="text-sm text-primary-600 hover:underline">View All</Link>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm">Upload a resume to see matches</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.slice(0, 5).map((job) => (
                      <Link key={job.id} to={`/jobs/${job.id}`} className="block">
                        <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{job.title}</h4>
                              <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                <Badge variant="success" className="text-xs">{job.match_percentage}% Match</Badge>
                                <Badge variant="outline" className="text-xs">{job.remote_type}</Badge>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Pipeline */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Application Pipeline</CardTitle>
                <Link to="/applications" className="text-sm text-primary-600 hover:underline">View All</Link>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm">No applications yet</p>
                    <p className="text-xs mt-1">Save jobs and apply to track them here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.slice(0, 5).map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{app.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{app.company}</p>
                        </div>
                        <Badge variant={app.status as any} className={statusColors[app.status]}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}