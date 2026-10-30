import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElLoading, ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

// Mock 模式（MSW）必须走同源 + 应用 base 路径，Service Worker 才能拦截；
// 接入真实后端时把 VITE_USE_MOCK 设为 false，请求直接发往 VITE_API_BASE_URL
const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const service: AxiosInstance = axios.create({
  baseURL: useMock
    ? import.meta.env.BASE_URL.replace(/\/$/, '')
    : import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

/* ---------------- 全局 loading（仅写操作，避免与页面级 v-loading 冲突） ---------------- */

let loadingCount = 0
let loadingInstance: ReturnType<typeof ElLoading.service> | null = null
const loadingMarked = new WeakSet<object>()

function startLoading(config: InternalAxiosRequestConfig) {
  if (config.silent || (config.method ?? 'get').toLowerCase() === 'get') return
  loadingMarked.add(config)
  loadingCount += 1
  loadingInstance ??= ElLoading.service({
    lock: true,
    text: '处理中...',
    background: 'rgba(0, 0, 0, 0.25)',
  })
}

function stopLoading(config?: InternalAxiosRequestConfig) {
  if (!config || !loadingMarked.has(config)) return
  loadingMarked.delete(config)
  loadingCount = Math.max(0, loadingCount - 1)
  if (loadingCount === 0 && loadingInstance) {
    loadingInstance.close()
    loadingInstance = null
  }
}

/* ---------------- 重复请求取消 ---------------- */

const pendingMap = new Map<string, AbortController>()

function requestKey(config: InternalAxiosRequestConfig) {
  return [config.method, config.url, JSON.stringify(config.params ?? {})].join('&')
}

function registerCancel(config: InternalAxiosRequestConfig) {
  if (config.signal) return
  const key = requestKey(config)
  pendingMap.get(key)?.abort()
  const controller = new AbortController()
  config.signal = controller.signal
  pendingMap.set(key, controller)
}

function releaseCancel(config?: InternalAxiosRequestConfig) {
  if (!config) return
  const key = requestKey(config)
  const controller = pendingMap.get(key)
  if (controller && controller.signal === config.signal) pendingMap.delete(key)
}

/* ---------------- 错误文案 ---------------- */

const STATUS_MESSAGE: Record<number, string> = {
  400: '请求参数有误',
  401: '登录状态已过期，请重新登录',
  403: '没有权限执行此操作',
  404: '请求的资源不存在',
  500: '服务器开小差了，请稍后再试',
  502: '网关异常，请稍后再试',
  503: '服务暂不可用，请稍后再试',
}

function isAuthError(message: string) {
  return message.includes('身份认证失败') || message.includes('token')
}

/* ---------------- 拦截器 ---------------- */

service.interceptors.request.use((config) => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  registerCancel(config)
  startLoading(config)
  return config
})

service.interceptors.response.use(
  (response) => {
    stopLoading(response.config)
    releaseCancel(response.config)

    // 接口统一返回 { code, message, data }，code === 0 表示成功
    const { code, data, message } = response.data
    if (code === 0) return data

    if (isAuthError(String(message ?? ''))) {
      useUserStore().logout()
      router.push('/login')
    }
    ElMessage.error(message || '请求失败')
    return Promise.reject(new Error(message || '请求失败'))
  },
  (error) => {
    const config = error.config as InternalAxiosRequestConfig | undefined
    stopLoading(config)
    releaseCancel(config)

    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const status: number = error.response?.status ?? 0
    if (status === 401) {
      useUserStore().logout()
      router.push('/login')
    }

    const message =
      error.response?.data?.message || STATUS_MESSAGE[status] || error.message || '网络错误'
    ElMessage.error(message)
    // 抛出带业务文案的 Error，调用方无需再解析 axios error
    return Promise.reject(new Error(message))
  },
)

export function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  return service(config) as unknown as Promise<T>
}
