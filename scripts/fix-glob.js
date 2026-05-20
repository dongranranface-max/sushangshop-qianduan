/**
 * 构建后修复脚本：替换 import.meta.glob 为空对象
 * 解决 UniApp CLI 2022 + Vite 5 不兼容问题
 * 运行时机：npm run build:h5 之后自动执行
 */

const fs = require('fs')
const path = require('path')

const TARGET_PATTERNS = [
  'const al=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const sl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const bl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const cl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const dl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const el=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const fl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const gl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const hl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const il=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const jl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const kl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const ll=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const ml=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const nl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const ol=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const pl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const ql=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const rl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const tl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const vl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const wl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const xl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const yl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const zl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Al=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Bl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Cl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Dl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const El=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Fl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Gl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Hl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Il=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Jl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Kl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Ll=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Ml=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Nl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Ol=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Pl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Rl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Sl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Tl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Ul=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Vl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Wl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Xl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Yl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const Zl=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const $l=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'const _l=import.meta.globEager("./locale/*.json"),_e=Object.assign',
  'import.meta.globEager("./locale/*.json"),_e=Object.assign',
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
