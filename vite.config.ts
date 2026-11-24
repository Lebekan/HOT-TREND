import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * base 说明（部署到 GitHub Pages 时很关键）：
 * - 本地开发：不设 VITE_BASE，base 为 '/'。
 * - GitHub Actions 构建：由 workflow 注入 VITE_BASE=/<仓库名>/，
 *   这样静态资源与 public/data/*.json 都能在子路径下正确加载。
 * - 若你使用「用户主页仓库」(<用户名>.github.io)，把 VITE_BASE 设为 '/'。
 */
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
})
