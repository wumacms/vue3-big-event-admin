import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
// 统一引入 Element Plus 样式（含 ElMessage / ElMessageBox / ElLoading 等函数式组件样式）
import 'element-plus/dist/index.css'
import './assets/main.css'

/**
 * 开启 Mock 时先启动 Service Worker 再挂载应用，
 * 否则首屏发出的请求会漏过拦截。
 */
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK !== 'true') return

  const { worker } = await import('./mock/browser')
  await worker.start({
    // 兼容 GitHub Pages 等子路径部署
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    // 未匹配到的请求（如静态资源）正常放行
    onUnhandledFrame: 'bypass',
  })
}

enableMocking().then(() => {
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')
})
