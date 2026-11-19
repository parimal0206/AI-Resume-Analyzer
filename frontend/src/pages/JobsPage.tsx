import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Filter, Briefcase, MapPin, DollarSign, Briefcase as BriefcaseIcon,
  ChevronDown, ChevronUp, ChevronRight
} from 'lucide-react'
import { jobApi } from '../services/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardFooter } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

interface Job {
  id: number
  title: string
  company: string
  location: string
  salary_range: string
  experience_level: string
  required_skills: string[]
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [experience, setExperience] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true)
      try {
        const res = await jobApi.list({
          keyword: search,
          location,
          experience_level: experience,
          limit: 50,
        })
        setJobs(res.data)
      } catch (err) {
        console.error('Failed to fetch jobs', err)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchJobs, 300)
    return () => clearTimeout(debounce)
  }, [search, location, experience])

  const experienceLevels = ['Entry', 'Junior', 'Mid', 'Senior', 'Staff', 'Principal']

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-foreground">Job Board</span>
            </div>
            <Link to="/dashboard">
              <Button variant="ghost">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search & Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title, company, keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            {showFilters && (
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Location (e.g., San Francisco, Remote)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative w-full sm:w-48">
                  <BriefcaseIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="flex h-10 w-full appearance-none rounded-lg border border-input bg-background px-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">All Levels</option>
                    {experienceLevels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2 mb-3" />
                  <div className="h-3 bg-muted rounded w-1/3 mb-3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No jobs found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Link key={job.id} to={`/jobs/${job.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <Badge variant="outline">{job.experience_level}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {job.location.includes('Remote') ? 'Remote' : 'Onsite'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">{job.title}</h3>
                    <p className="text-muted-foreground text-sm mb-2 flex items-center gap-1">
                      <BriefcaseIcon className="h-3.5 w-3.5" />
                      {job.company}
                    </p>
                    <p className="text-muted-foreground text-sm mb-3 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </p>
                    {job.salary_range && (
                      <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-3 flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {job.salary_range}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {job.required_skills.slice(0, 5).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                      ))}
                      {job.required_skills.length > 5 && (
                        <Badge variant="secondary" className="text-xs">+{job.required_skills.length - 5}</Badge>
                      )}
                    </div>
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
      </main>
    </div>
  )
}