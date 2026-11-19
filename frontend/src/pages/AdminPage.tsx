import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, FileText, Briefcase, TrendingUp, ArrowLeft,
  Plus, Edit, Trash2, Search
} from 'lucide-react'
import { useAuth } from '../store/auth'
import api from '../services/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

interface Job {
  id: number
  title: string
  company: string
  location: string
  salary_range: string
  experience_level: string
}

interface Stats {
  users_count: number
  resumes_count: number
  jobs_count: number
  applications_count: number
}

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs'>('overview')
  const [jobSearch, setJobSearch] = useState('')
  const [showJobModal, setShowJobModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [jobForm, setJobForm] = useState({
    title: '', company: '', description: '', location: '',
    salary_range: '', experience_level: 'Mid', required_skills: ''
  })

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/dashboard')
      return
    }
    fetchStats()
    fetchJobs()
  }, [user])

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats')
      setStats(res.data)
    } catch (err) {
      console.error('Failed to fetch stats', err)
    }
  }

  const fetchJobs = async () => {
    try {
      const res = await api.get('/admin/jobs')
      setJobs(res.data)
    } catch (err) {
      console.error('Failed to fetch jobs', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/admin/jobs', {
        ...jobForm,
        required_skills: jobForm.required_skills.split(',').map(s => s.trim()).filter(Boolean)
      })
      setShowJobModal(false)
      setJobForm({ title: '', company: '', description: '', location: '', salary_range: '', experience_level: 'Mid', required_skills: '' })
      fetchJobs()
    } catch (err) {
      console.error('Failed to create job', err)
    }
  }

  const handleDeleteJob = async (jobId: number) => {
    if (window.confirm('Delete this job?')) {
      try {
        await api.delete(`/admin/jobs/${jobId}`)
        fetchJobs()
      } catch (err) {
        console.error('Failed to delete job', err)
      }
    }
  }

  if (!user?.is_admin) {
    return null
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
              <span className="text-xl font-bold text-foreground">Admin Panel</span>
              <Badge variant="destructive">Admin</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6 border-b">
          <nav className="flex gap-6" aria-label="Admin tabs">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'jobs', label: 'Jobs', icon: Briefcase },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Overview */}
        {activeTab === 'overview' && stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[
              { label: 'Total Users', value: stats.users_count, icon: Users, color: 'blue' },
              { label: 'Resumes', value: stats.resumes_count, icon: FileText, color: 'green' },
              { label: 'Jobs', value: stats.jobs_count, icon: Briefcase, color: 'purple' },
              { label: 'Applications', value: stats.applications_count, icon: TrendingUp, color: 'orange' },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                      <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Jobs */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => { setEditingJob(null); setShowJobModal(true); }} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Job
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Company</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Salary</th>
                    <th className="pb-3">Level</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {jobs
                    .filter(j => j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
                              j.company.toLowerCase().includes(jobSearch.toLowerCase()))
                    .map((job) => (
                    <tr key={job.id}>
                      <td className="py-3 text-sm">{job.id}</td>
                      <td className="py-3 text-sm font-medium">{job.title}</td>
                      <td className="py-3 text-sm">{job.company}</td>
                      <td className="py-3 text-sm">{job.location}</td>
                      <td className="py-3 text-sm">{job.salary_range}</td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-xs">{job.experience_level}</Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingJob(job)
                            setJobForm({
                              title: job.title,
                              company: job.company,
                              description: '',
                              location: job.location,
                              salary_range: job.salary_range,
                              experience_level: job.experience_level,
                              required_skills: ''
                            })
                            setShowJobModal(true)
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteJob(job.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Job Modal */}
        {showJobModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{editingJob ? 'Edit Job' : 'Create Job'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateJob} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title *</label>
                      <Input value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company *</label>
                      <Input value={jobForm.company} onChange={e => setJobForm({...jobForm, company: e.target.value})} required />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium">Location</label>
                      <Input value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Salary Range</label>
                      <Input value={jobForm.salary_range} onChange={e => setJobForm({...jobForm, salary_range: e.target.value})} placeholder="$100,000 - $150,000" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Experience Level</label>
                      <select value={jobForm.experience_level} onChange={e => setJobForm({...jobForm, experience_level: e.target.value})} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        <option value="Entry">Entry</option>
                        <option value="Junior">Junior</option>
                        <option value="Mid">Mid</option>
                        <option value="Senior">Senior</option>
                        <option value="Staff">Staff</option>
                        <option value="Principal">Principal</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Required Skills (comma-separated)</label>
                    <Input value={jobForm.required_skills} onChange={e => setJobForm({...jobForm, required_skills: e.target.value})} placeholder="Python, React, AWS, Docker" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} rows={4} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" required />
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setShowJobModal(false)}>Cancel</Button>
                    <Button type="submit" loading={loading}>{editingJob ? 'Update' : 'Create'}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}