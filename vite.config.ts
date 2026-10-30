import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath, URL } from 'node:url'

const isAnalyze = process.env.ANALYZE === 'true'

export default defineConfig({
  // GitHub Pages 部署在子路径下时由 CI 注入 VITE_BASE=/<repo>/
  base: process.env.VITE_BASE || '/',
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      // 样式已在 main.ts 全量引入，这里关闭按组件注入，避免 dev 反复优化依赖
      resolvers: [ElementPlusResolver({ importStyle: false })],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: false })],
      dts: 'src/components.d.ts',
    }),
    // ANALYZE=true pnpm build 时生成体积报告 dist/stats.html
    isAnalyze &&
      visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true, open: false }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    // 提前预构建体积大、加载较晚的依赖，避免运行中触发重新优化导致页面 504
    include: ['element-plus', '@wangeditor/editor', '@wangeditor/editor-for-vue'],
  },
  build: {
    // wangEditor 单个体积就接近 900KB，属于已知第三方体积，这里放宽提示阈值
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // 拆出体积大且更新频率低的依赖，利用浏览器缓存（rolldown 要求函数形式）
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (id.includes('element-plus') || id.includes('@element-plus')) return 'vendor-element'
          if (
            id.includes('node_modules/vue/') ||
            id.includes('node_modules/@vue/') ||
            id.includes('vue-router') ||
            id.includes('pinia')
          ) {
            return 'vendor-vue'
          }
        },
      },
    },
  },
})
