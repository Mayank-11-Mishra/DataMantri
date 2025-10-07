import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/v1/auth/login', { email, password }),
  
  getCurrentUser: () =>
    api.get('/api/v1/auth/me'),
}

export const pipelinesAPI = {
  list: (params?: { status?: string }) =>
    api.get('/api/v1/pipelines/', { params }),
  
  get: (id: string) =>
    api.get(`/api/v1/pipelines/${id}`),
  
  create: (data: any) =>
    api.post('/api/v1/pipelines/', data),
  
  update: (id: string, data: any) =>
    api.put(`/api/v1/pipelines/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/api/v1/pipelines/${id}`),
  
  trigger: (id: string) =>
    api.post(`/api/v1/pipelines/${id}/trigger`),
  
  getRuns: (id: string, limit = 50) =>
    api.get(`/api/v1/pipelines/${id}/runs`, { params: { limit } }),
  
  getRunDetail: (runId: string) =>
    api.get(`/api/v1/runs/${runId}`),
}

export default api


