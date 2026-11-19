import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FileText, ArrowLeft, Target, AlertCircle,
  CheckCircle, XCircle, Brain
} from 'lucide-react'
import { resumeApi, jobApi } from '../services/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ATGauge } from '../components/charts/ATSGauge'
import { getScoreColor } from '../lib/utils'

interface Resume {
  id: number
  title: string
  created_at: string
  ats_score?: number
}

interface MatchResult {
  match_score: number
  semantic_similarity: number
  matched_skills: string[]
  missing_skills: string[]
  recommendation: string
}

export default function MatchPage() {
  const navigate = useNavigate()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)
  const [jdText, setJdText] = useState('')
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
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

  const handleMatch = async () => {
    if (!selectedResumeId || !jdText.trim()) {
      setError('Please select a resume and paste a job description')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await jobApi.match(selectedResumeId, jdText)
      setMatchResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Match analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const handleJobSelect = async (jobId: number) => {
    if (!selectedResumeId) return
    try {
      const jobRes = await jobApi.get(jobId)
      setJdText(jobRes.data.description)
    } catch (err) {
      console.error('Failed to fetch job', err)
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
              <span className="text-xl font-bold text-foreground">JD Matcher</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Resume vs Job Description</h1>
          <p className="text-muted-foreground mt-2">
            Paste any job description to see how well your resume matches.
            Get keyword gaps, match score, and tailored suggestions.
          </p>
        </div>

        {/* Input Section */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Resume Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Resume</CardTitle>
            </CardHeader>
            <CardContent>
              {resumes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No resumes uploaded</p>
                  <Link to="/upload">
                    <Button className="mt-4 gap-2" size="sm">
                      Upload Resume
                    </Button>
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedResumeId || ''}
                  onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                  className="flex h-10 w-full items-center rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.ats_score !== undefined ? `ATS: ${r.ats_score}` : 'Not analyzed'})
                    </option>
                  ))}
                </select>
              )}
            </CardContent>
          </Card>

          {/* Quick Job Picker */}
          <Card>
            <CardHeader>
              <CardTitle>Or Pick a Saved Job</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search for a job by ID..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    handleJobSelect(Number(e.currentTarget.value))
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter a Job ID from the Job Board to auto-fill the description
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Job Description Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here..."
              className="w-full min-h-[200px] rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y font-mono"
              rows={10}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setJdText('')}>Clear</Button>
              <Button onClick={handleMatch} loading={loading} className="gap-2" disabled={!selectedResumeId || !jdText.trim()}>
                <Brain className="h-4 w-4" />
                Analyze Match
              </Button>
            </div>
            {error && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {matchResult && (
          <div className="space-y-6 animate-fade-in">
            {/* Match Score */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Match Score</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-4">
                  <ATGauge score={Math.round(matchResult.match_score)} size={160} strokeWidth={12} />
                </CardContent>
                <CardFooter className="text-center">
                  <Badge variant={matchResult.match_score >= 80 ? 'success' : matchResult.match_score >= 60 ? 'warning' : 'destructive'} className="text-lg px-4 py-2">
                    {matchResult.match_score >= 80 ? 'Excellent Match' : matchResult.match_score >= 60 ? 'Good Match' : 'Needs Improvement'}
                  </Badge>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Semantic Similarity</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-4">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(matchResult.semantic_similarity)}`}>
                      {Math.round(matchResult.semantic_similarity)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Content Alignment</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Skill Coverage</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-4">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(matchResult.matched_skills.length / (matchResult.matched_skills.length + matchResult.missing_skills.length) * 100 || 0)}`}>
                      {matchResult.matched_skills.length}/{matchResult.matched_skills.length + matchResult.missing_skills.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Skills Matched</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Skills Breakdown */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <CardTitle>Matched Skills ({matchResult.matched_skills.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.matched_skills.length > 0 ? (
                      matchResult.matched_skills.map((skill) => (
                        <Badge key={skill} variant="success" className="text-xs">{skill}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No matching skills found</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <CardTitle>Missing Skills ({matchResult.missing_skills.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.missing_skills.length > 0 ? (
                      matchResult.missing_skills.slice(0, 15).map((skill) => (
                        <Badge key={skill} variant="destructive" className="text-xs">{skill}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">All required skills covered!</p>
                    )}
                    {matchResult.missing_skills.length > 15 && (
                      <Badge variant="secondary" className="text-xs">+{matchResult.missing_skills.length - 15} more</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendation */}
            <Card className="border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
              <CardHeader className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary-600" />
                <CardTitle>Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base">{matchResult.recommendation}</p>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardContent className="py-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Next Steps</h3>
                <p className="text-muted-foreground mb-4">Improve your match by adding missing keywords to your resume</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link to="/upload">
                    <Button className="gap-2">
                      <FileText className="h-4 w-4" />
                      Update Resume
                    </Button>
                  </Link>
                  <Link to="/skill-gap">
                    <Button variant="outline" className="gap-2">
                      <Target className="h-4 w-4" />
                      View Skill Gap Report
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}