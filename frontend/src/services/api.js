import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)

// Jobs
export const getJobs = () => api.get('/jobs/')
export const getJob = (id) => api.get(`/jobs/${id}`)
export const createJob = (data) => api.post('/jobs/', data)
export const deleteJob = (id) => api.delete(`/jobs/${id}`)

// Candidates
export const uploadResumes = (jobId, files) => {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  return api.post(`/candidates/upload/${jobId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export const getCandidates = (jobId) => api.get(`/candidates/job/${jobId}`)
export const updateStatus = (candidateId, status) =>
  api.patch(`/candidates/${candidateId}/status`, { status })
export const deleteCandidate = (candidateId) => api.delete(`/candidates/${candidateId}`)
export const exportCSV = (jobId) =>
  api.get(`/candidates/export/${jobId}`, { responseType: 'blob' })

export default api
