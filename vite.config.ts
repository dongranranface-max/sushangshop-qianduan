import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_URL || '/mall/'

  return {
    plugins: [
      uni(),
    ],
    base,
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT || 5173),
      open: `${base}`,
    },
    build: {
      minify: 'esbuild',
      // 生产环境移除 console 和 debugger
      rollupOptions: {
        output: {
          // 文件名带 hash 用于长期缓存
          entryFileNames: 'static/js/[name]-[hash].js',
          chunkFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
        },
      },
    },
    esbuild: {
      // 生产移除 console（保留 warn/error）
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      treeShaking: true,
    },
  }
})