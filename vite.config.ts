import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_URL || '/mall/'

  return {
    plugins: [uni()],
    base,
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT || 5173),
      // 开发时 / 自动跳到 /mall/，与 Nginx 行为一致
      open: `${base}`,
    },
    build: {
      minify: 'esbuild',
    },
  }
})
