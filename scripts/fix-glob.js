/**
 * 构建后修复脚本：替换 import.meta.glob 为空对象
 * 解决 UniApp CLI 2022 + Vite 5 不兼容问题
 * 运行时机：npm run build:h5 之后自动执行
 */

const fs = require('fs')
const path = require('path')

const TARGET_PATTERNS = [
  'const al=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const al=import.meta.glob("./locale/*.json"),_e=Object.assign',
]
const REPLACEMENT = 'const al={},_e=Object.assign'

function findJsFiles(dir) {
  const files = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findJsFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath)
    }
  }
  return files
}

function fixGlob() {
  const assetsDir = path.join(__dirname, '..', 'dist', 'build', 'h5', 'assets')

  if (!fs.existsSync(assetsDir)) {
    console.warn('[fix-glob] assets dir not found, skipping')
    return
  }

  const jsFiles = findJsFiles(assetsDir)
  let fixed = 0

  for (const file of jsFiles) {
    let content = fs.readFileSync(file, 'utf-8')
    for (const pattern of TARGET_PATTERNS) {
      if (content.includes(pattern)) {
        content = content.replace(pattern, REPLACEMENT)
        fs.writeFileSync(file, content)
        fixed++
        console.log(`[fix-glob] patched (${pattern.split('=')[1].split('(')[0]}): ${path.basename(file)}`)
        break
      }
    }
  }

  if (fixed > 0) {
    console.log(`[fix-glob] done, fixed ${fixed} file(s)`)
  } else {
    console.log('[fix-glob] no files needed fixing')
  }
}

fixGlob()
