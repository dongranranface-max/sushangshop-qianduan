/**
 * 压缩 Logo + 生成 TabBar 图标（Windows 用 PowerShell 绘图，无 sharp 依赖）
 */
import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const ps1 = path.join(__dirname, 'optimize-assets.ps1')

function fmt(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

function report() {
  const logo = path.join(root, 'src/static/logo.png')
  const tabDir = path.join(root, 'src/static/tabbar')
  if (fs.existsSync(logo)) {
    console.log(`[optimize-assets] logo.png -> ${fmt(fs.statSync(logo).size)}`)
  }
  if (fs.existsSync(tabDir)) {
    let total = 0
    for (const f of fs.readdirSync(tabDir).filter((n) => n.endsWith('.png'))) {
      const n = path.join(tabDir, f)
      const s = fs.statSync(n).size
      total += s
      if (/^(home|catalog|cart|wealth|user)/.test(f)) {
        console.log(`  ${f.padEnd(22)} ${fmt(s)}`)
      }
    }
    console.log(`  tabbar (main 10) total: ${fmt(total)}`)
  }
}

if (process.platform === 'win32') {
  const r = spawnSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1],
    { stdio: 'inherit', cwd: root }
  )
  if (r.status !== 0) process.exit(r.status ?? 1)
  report()
} else {
  console.error('[optimize-assets] 非 Windows 请在本机运行 optimize-assets.ps1 或预生成 src/static 资源')
  process.exit(1)
}
