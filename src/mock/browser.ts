import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/** 浏览器端 Mock：通过 Service Worker 拦截真实网络请求，DevTools 的 Network 面板可见 */
export const worker = setupWorker(...handlers)
