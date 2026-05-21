/**
 * 构建后修复：替换 import.meta.globEager 避免 H5 白屏
 */
const fs = require('fs')
const path = require('path')

const assetsDir = path.join(__dirname, '..', 'dist', 'build', 'h5', 'assets')

function findJsFiles(dir) {
  const files = []
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...findJsFiles(full))
    else if (entry.name.endsWith('.js')) files.push(full)
  }
  return files
}

function fixGlob() {
  const jsFiles = findJsFiles(assetsDir)
  let fixed = 0
  const re = /import\.meta\.globEager\([^)]+\)/g

  for (const file of jsFiles) {
    let content = fs.readFileSync(file, 'utf-8')
    if (!content.includes('globEager')) continue
    const next = content.replace(re, '({})')
    if (next !== content) {
      fs.writeFileSync(file, next)
      fixed++
      console.log('[fix-glob]', path.basename(file))
    }
  }

  // 兼容旧版固定变量名替换
  const legacy = 'import.meta.globEager("./locale/*.json")'
  for (const file of jsFiles) {
    let content = fs.readFileSync(file, 'utf-8')
    if (content.includes(legacy)) {
      content = content.replaceAll(legacy, '({})')
      fs.writeFileSync(file, content)
      if (!fixed) console.log('[fix-glob] legacy', path.basename(file))
      fixed++
    }
  }

  console.log(fixed ? `[fix-glob] done, ${fixed} file(s)` : '[fix-glob] no patch needed')
}

fixGlob()
