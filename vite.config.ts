import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  root: './src',
  build: {
    outDir: '../unpackage/dist/build/h5',
    assetsDir: 'static'
  }
})
