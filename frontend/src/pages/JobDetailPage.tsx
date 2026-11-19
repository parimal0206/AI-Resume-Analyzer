import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  MapPin, Clock, Building2, ArrowLeft,
  Bookmark, BookmarkCheck, Download
} from 'lucide-react'
import { jobApi, applicationApi } from '../services/api'
import { useAuth } from '../store/auth'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

interface Job {
  id: number
  title: string
  company: string
  description: string
  location: string
  salary_range: string
  experience_level: string
  job_type: string
  remote_type: string
  required_skills: string[]
  created_at: string
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [applying, setApplying] = useState(false)
  const [saved, setSaved] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return
      try {
        const res = await jobApi.get(Number(id))
        setJob(res.data)
      } catch (err) {
        console.error('Failed to fetch job', err)
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [id])

  useEffect(() => {
    // Check if saved/applied - would need API calls in real implementation
  }, [user, job])

  const handleSave = async () => {
    if (!user) { navigate('/login'); return }
    setSaving(true)
    try {
      await applicationApi.saveJob(job!.id)
      setSaved(true)
    } catch (err) {
      console.error('Failed to save job', err)
    } finally {
      setSaving(false)
    }
  }

  const handleApply = async () => {
    if (!user) { navigate('/login'); return }
    setApplying(true)
    try {
      await applicationApi.createApplication(job!.id, 'applied')
      setApplied(true)
      setSaved(true)
    } catch (err) {
      console.error('Failed to apply', err)
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <CardContent className="py-12">
            <h2 className="text-xl font-bold mb-2">Job Not Found</h2>
            <Button onClick={() => navigate('/jobs')}>Back to Jobs</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSave} loading={saving}>
                {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                {saved ? 'Saved' : 'Save'}
              </Button>
              <Button size="sm" onClick={handleApply} loading={applying} disabled={applied}>
                {applied ? 'Applied' : 'Apply Now'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Job Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="outline">{job.experience_level}</Badge>
                  <Badge variant="secondary">{job.job_type}</Badge>
                  <Badge variant={job.remote_type === 'Remote' ? 'success' : job.remote_type === 'Hybrid' ? 'warning' : 'outline'}>
                    {job.remote_type}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold mb-1">{job.title}</h1>
                <p className="text-xl text-muted-foreground">{job.company}</p>
              </div>
              {job.salary_range && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{job.salary_range}</p>
                  <p className="text-sm text-muted-foreground">Estimated</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{job.job_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {job.description}
            </div>
          </CardContent>
        </Card>

        {/* Required Skills */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Required Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.map((skill) => (
                <Badge key={skill} variant="outline">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Match Analysis - if user has a resume */}
        {user && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Match Analysis</CardTitle>
              <Link to="/match">
                <Button variant="outline" size="sm" asChild>
                  <span>Run Custom Match</span>
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Upload a resume and run the JD Matcher to see how well you fit this specific role.
              </p>
              <Link to="/match">
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Analyze Against This Job
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}