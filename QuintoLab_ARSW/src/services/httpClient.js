import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 8000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// El store se registra aquí para enterarse de un 401 sin crear imports circulares.
let unauthorizedHandler = () => {}
export const onUnauthorized = (fn) => {
  unauthorizedHandler = fn
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token')
      unauthorizedHandler()
    }
    return Promise.reject(err)
  },
)

export default api
