import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      // Could implement refresh token here
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface Resume {
  id: number
  title: string
  created_at: string
  ats_score?: number
  parsed_data?: any
}

export interface Job {
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

export interface Analysis {
  overall_ats_score: number
  section_scores: Record<string, { score: number; max: number }>
  strengths: string[]
  weaknesses: string[]
  action_items: string[]
  rewritten_bullets: { original: string; improved: string }[]
  suggested_summary: string
  ai_insights: string
}

export interface Recommendation {
  id: number
  title: string
  company: string
  location: string
  salary_range: string
  experience_level: string
  job_type: string
  remote_type: string
  match_percentage: number
  semantic_score: number
  skill_match: {
    matched: string[]
    missing: string[]
    match_percentage: number
  }
  experience_fit: number
  why_recommended: string
}

export interface Application {
  id: number
  job_id: number
  title: string
  company: string
  status: string
  updated_at: string
}

export const authApi = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) => {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  me: () => api.get('/auth/me'),
}

export const resumeApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list: () => api.get<Resume[]>('/resumes'),
  get: (id: number) => api.get<Resume>(`/resumes/${id}`),
  delete: (id: number) => api.delete(`/resumes/${id}`),
  analyze: (id: number) => api.post(`/resumes/${id}/analyze`),
  getAnalysis: (id: number) => api.get<Analysis>(`/resumes/${id}/analysis`),
}

export const jobApi = {
  list: (params?: { skip?: number; limit?: number; location?: string; experience_level?: string; keyword?: string }) =>
    api.get<Job[]>('/jobs', { params }),
  get: (id: number) => api.get<Job>(`/jobs/${id}`),
  recommend: (resumeId: number, params?: { limit?: number; location?: string }) =>
    api.get<Recommendation[]>(`/resumes/${resumeId}/recommendations`, { params }),
  match: (resumeId: number, jdText: string) =>
    api.post('/match', { resume_id: resumeId, jd_text: jdText }),
  skillGap: (resumeId: number) => api.get(`/skills/gap/${resumeId}`),
}

export const applicationApi = {
  saveJob: (jobId: number) => api.post(`/jobs/${jobId}/save`),
  unsaveJob: (jobId: number) => api.delete(`/jobs/${jobId}/unsave`),
  listSavedJobs: () => api.get<Job[]>('/saved-jobs'),
  createApplication: (jobId: number, status: string) =>
    api.post('/applications', { job_id: jobId, status }),
  listApplications: () => api.get<Application[]>('/applications'),
  updateApplication: (id: number, status: string) =>
    api.patch(`/applications/${id}`, { status }),
}

export default api