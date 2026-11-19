import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileText, X, CheckCircle, AlertCircle, Loader2,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import { resumeApi } from '../services/api'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

interface ParsedData {
  name?: string
  email?: string
  phone?: string
  links?: { linkedin?: string; github?: string; portfolio?: string }
  skills?: string[]
  years_of_experience?: number
  sections?: Record<string, string>
}

export default function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'upload' | 'review' | 'success'>('upload')
  const [resumeId, setResumeId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((selectedFile: File) => {
    setError('')
    if (!['.pdf', '.docx', '.doc', '.txt'].some(ext => selectedFile.name.toLowerCase().endsWith(ext))) {
      setError('Please upload a PDF, DOCX, or TXT file')
      return
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }
    setFile(selectedFile)
    setStep('upload')
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const res = await resumeApi.upload(file)
      setParsedData(res.data.parsed_data)
      setResumeId(res.data.id)
      setStep('review')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!resumeId) return
    try {
      await resumeApi.analyze(resumeId)
      setStep('success')
    } catch (err) {
      setError('Analysis failed. You can run it from the dashboard.')
    }
  }

  const reset = () => {
    setFile(null)
    setParsedData(null)
    setResumeId(null)
    setStep('upload')
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardContent className="text-center py-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Resume Uploaded & Analyzed!</h2>
              <p className="text-muted-foreground mb-6">Your resume has been parsed, scored, and matched against job opportunities.</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/dashboard')} className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate('/jobs')}>
                  Browse Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Upload Your Resume</h1>
          <p className="text-muted-foreground mt-2">
            Drag & drop your PDF or DOCX file. We'll extract skills, experience, education, and more.
          </p>
        </div>

        {/* Upload Zone */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            {file ? (
              <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <FileText className="h-10 w-10 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="relative border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-1">Drag & drop your resume here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, TXT • Max 5MB</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {!file && !uploading && (
              <Button className="mt-6 w-full" onClick={triggerFileInput}>
                Choose File
              </Button>
            )}

            {file && !uploading && (
              <Button className="mt-6 w-full" onClick={handleUpload} size="lg">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload & Parse
              </Button>
            )}

            {uploading && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading and parsing...</span>
                  <span>Processing</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600 animate-pulse w-1/2" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parsed Data Review */}
        {step === 'review' && parsedData && (
          <Card>
            <CardHeader>
              <CardTitle>Parsed Information</CardTitle>
              <CardDescription>Review the extracted data before analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="space-y-1 text-sm">
                    {parsedData.name && <p><strong>Name:</strong> {parsedData.name}</p>}
                    {parsedData.email && <p><strong>Email:</strong> {parsedData.email}</p>}
                    {parsedData.phone && <p><strong>Phone:</strong> {parsedData.phone}</p>}
                    {parsedData.links?.linkedin && <p><strong>LinkedIn:</strong> {parsedData.links.linkedin}</p>}
                    {parsedData.links?.github && <p><strong>GitHub:</strong> {parsedData.links.github}</p>}
                    {parsedData.links?.portfolio && <p><strong>Portfolio:</strong> {parsedData.links.portfolio}</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Experience & Skills</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Years of Experience:</strong> {parsedData.years_of_experience || 0}</p>
                    <p><strong>Skills Detected:</strong> {parsedData.skills?.length || 0}</p>
                  </div>
                  {parsedData.skills && parsedData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {parsedData.skills.slice(0, 12).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                      ))}
                      {parsedData.skills.length > 12 && (
                        <Badge variant="secondary" className="text-xs">+{parsedData.skills.length - 12} more</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sections Found */}
              {parsedData.sections && (
                <div>
                  <h4 className="font-medium mb-2">Sections Detected</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(parsedData.sections).map(([key, value]) => (
                      <Badge key={key} variant={value.trim() ? 'success' : 'secondary'}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-4">
              <Button variant="outline" onClick={reset}>
                <X className="h-4 w-4 mr-1" />
                Start Over
              </Button>
              <Button onClick={handleAnalyze} className="gap-2">
                Run AI Analysis
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}