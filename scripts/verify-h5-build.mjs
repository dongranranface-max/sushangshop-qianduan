/**
 * 校验构建产物是否完整（避免线上只更新 JS 未更新 CSS 导致样式不一致）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const h5 = path.join(__dirname, '..', 'dist', 'build', 'h5')
const indexPath = path.join(h5, 'index.html')

if (!fs.existsSync(indexPath)) {
  console.error('[verify-h5] 缺少 dist/build/h5/index.html，请先 npm run build:h5')
  process.exit(1)
}

const html = fs.readFileSync(indexPath, 'utf-8')
const assetsDir = path.join(h5, 'assets')
const refs = [
  ...html.matchAll(/(?:href|src)="(?:\.\/|\/mall\/)?assets\/([^"]+)"/g),
].map((m) => m[1])

let missing = 0
for (const ref of refs) {
  const full = path.join(assetsDir, ref)
  if (!fs.existsSync(full)) {
    console.error(`[verify-h5] 缺失资源: assets/${ref}`)
    missing++
  }
}

const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : []
console.log('[verify-h5] index.html 引用:', refs.join(', '))
console.log('[verify-h5] assets 目录共', assetFiles.length, '个文件')

if (missing > 0) {
  console.error('[verify-h5] 构建不完整，请重新 build 并整包部署')
  process.exit(1)
}

console.log('[verify-h5] OK — 可整包 rsync 到 /www/jixiang-qianduan/h5/')
