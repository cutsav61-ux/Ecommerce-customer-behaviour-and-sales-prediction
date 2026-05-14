import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response error handling
api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error || err.message || 'Request failed'
    return Promise.reject(new Error(msg))
  }
)

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
}

export const datasetAPI = {
  upload: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/dataset/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
  },
  getSample: () => api.get('/dataset/sample'),
  list: () => api.get('/dataset/list'),
  downloadSample: () => window.open('/api/dataset/download-sample', '_blank'),
}

export const modelAPI = {
  train: (payload) => api.post('/model/train', payload, { timeout: 120000 }),
  status: () => api.get('/model/status'),
}

export const predictAPI = {
  behavior: (data) => api.post('/predict/behavior', data),
  sales: (data) => api.post('/predict/sales', data),
  batch: (file, type) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    return api.post('/predict/batch', fd, { timeout: 60000 })
  },
  history: (limit = 50) => api.get(`/predict/history?limit=${limit}`),
  exportCSV: () => window.open('/api/export/predictions', '_blank'),
}

export const adminAPI = {
  login: (creds) => api.post('/auth/login', creds),
  overview: () => api.get('/admin/overview'),
  datasets: () => api.get('/admin/datasets'),
  deleteDataset: (id) => api.delete(`/admin/datasets/${id}`),
}

export default api
