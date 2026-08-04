import axios from 'axios'
import { useAuthStore } from '@/store/auth-store'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    // 统一处理 HTTP 200 但业务码非0的情况
    const data = response.data
    if (data && typeof data.code === 'number' && data.code !== 0) {
      const message = data.message || '操作失败'
      return Promise.reject(new Error(message))
    }
    return response
  },
  (error) => {
    // 处理 HTTP 非2xx响应（如400、401、500等）
    const serverMessage = error.response?.data?.message
    if (serverMessage) {
      return Promise.reject(new Error(serverMessage))
    }
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      return Promise.reject(new Error('登录已过期，请重新登录'))
    }
    return Promise.reject(new Error(error.message || '网络请求失败'))
  },
)