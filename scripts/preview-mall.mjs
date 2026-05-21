/**
 * 本地以与线上一致的路径预览 H5：http://localhost:5173/mall/#/
 * 用法：npm run build:h5 && node scripts/preview-mall.mjs
 */
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', 'dist', 'build', 'h5')
const PORT = Number(process.env.PREVIEW_PORT || 5173)
const PREFIX = '/mall'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type })
  res.end(body)
}

function resolveFile(urlPath) {
  let p = urlPath
  if (p.startsWith(PREFIX)) p = p.slice(PREFIX.length) || '/'
  if (p === '/' || p === '') p = '/index.html'
  const file = path.normalize(path.join(ROOT, p))
  if (!file.startsWith(ROOT)) return null
  return file
}

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error('[preview-mall] 未找到 dist/build/h5，请先执行: npm run build:h5')
  process.exit(1)
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)

  if (url.pathname === '/' || url.pathname === '') {
    res.writeHead(302, { Location: `${PREFIX}/` })
    res.end()
    return
  }

  if (!url.pathname.startsWith(PREFIX)) {
    send(res, 404, 'Not Found. Use /mall/')
    return
  }

  let file = resolveFile(url.pathname)
  if (file && fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html')
  }
  if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(ROOT, 'index.html')
  }

  const ext = path.extname(file)
  const type = MIME[ext] || 'application/octet-stream'
  fs.readFile(file, (err, data) => {
    if (err) {
      send(res, 500, String(err))
      return
    }
    res.writeHead(200, { 'Content-Type': type })
    res.end(data)
  })
})

server.listen(PORT, '0.0.0.0', () => {
  const url = `http://localhost:${PORT}${PREFIX}/`
  console.log(`[preview-mall] 静态目录: ${ROOT}`)
  console.log(`[preview-mall] 与线上一致入口: ${url}`)
  console.log(`[preview-mall] 线上地址: http://47.96.102.163/mall/`)
})
