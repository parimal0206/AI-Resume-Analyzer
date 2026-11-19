import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FolderOpen, Briefcase, ArrowLeft, ChevronRight,
  Save, Send, MessageSquare, CheckCircle, XCircle, MapPin
} from 'lucide-react'
import { applicationApi } from '../services/api'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

interface Application {
  id: number
  job_id: number
  title: string
  company: string
  status: string
  updated_at: string
}

interface SavedJob {
  id: number
  title: string
  company: string
  location: string
  salary_range: string
}

const STATUS_ORDER = ['saved', 'applied', 'interview', 'offer', 'rejected']
const STATUS_LABELS: Record<string, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}
const STATUS_ICONS: Record<string, any> = {
  saved: Save,
  applied: Send,
  interview: MessageSquare,
  offer: CheckCircle,
  rejected: XCircle,
}

export default function ApplicationsPage() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [activeTab, setActiveTab] = useState<'pipeline' | 'saved'>('pipeline')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, savedRes] = await Promise.all([
          applicationApi.listApplications(),
          applicationApi.listSavedJobs(),
        ])
        setApplications(appsRes.data)
        setSavedJobs(savedRes.data)
      } catch (err) {
        console.error('Failed to fetch applications', err)
      }
    }
    fetchData()
  }, [])

  const updateStatus = async (appId: number, newStatus: string) => {
    try {
      await applicationApi.updateApplication(appId, newStatus)
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a))
    } catch (err) {
      console.error('Failed to update status', err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">Applications</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6 border-b">
          <nav className="flex gap-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pipeline'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Pipeline ({applications.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'saved'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Saved Jobs ({savedJobs.length})
            </button>
          </nav>
        </div>

        {/* Pipeline View */}
        {activeTab === 'pipeline' && (
          <div className="grid gap-6 lg:grid-cols-5">
            {STATUS_ORDER.map((status) => {
              const statusApps = applications.filter(a => a.status === status)
              const Icon = STATUS_ICONS[status]
              return (
                <Card key={status} className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {STATUS_LABELS[status]}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">{statusApps.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 min-h-[200px]">
                      {statusApps.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Icon className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p className="text-sm">No applications</p>
                          <p className="text-xs">Drag or update status to move here</p>
                        </div>
                      ) : (
                        statusApps.map((app) => (
                          <div
                            key={app.id}
                            className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <Link to={`/jobs/${app.job_id}`} className="block">
                              <h4 className="font-medium truncate">{app.title}</h4>
                              <p className="text-sm text-muted-foreground truncate">{app.company}</p>
                            </Link>
                            <div className="flex items-center justify-between mt-2">
                              <select
                                value={app.status}
                                onChange={(e) => updateStatus(app.id, e.target.value)}
                                className="text-xs border rounded px-2 py-1 bg-background"
                              >
                                {STATUS_ORDER.map((s) => (
                                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                ))}
                              </select>
                              <span className="text-xs text-muted-foreground">
                                {new Date(app.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Saved Jobs View */}
        {activeTab === 'saved' && (
          <div>
            {savedJobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Saved Jobs</h3>
                  <p className="text-muted-foreground mb-4">Browse the job board and save interesting positions to track them here.</p>
                  <Link to="/jobs">
                    <Button className="gap-2">
                      <Briefcase className="h-4 w-4" />
                      Browse Jobs
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {savedJobs.map((job) => (
                  <Link key={job.id} to={`/jobs/${job.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardContent className="pt-6">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{job.title}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{job.company}</p>
                        <p className="text-muted-foreground text-sm mb-2 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </p>
                        {job.salary_range && (
                          <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                            {job.salary_range}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="border-t pt-4">
                        <Button variant="outline" className="w-full justify-between">
                          View Details
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}