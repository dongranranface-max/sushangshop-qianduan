/** @deprecated 请使用 optimize-assets.mjs；保留此入口供 postinstall 兼容 */
import { spawnSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'optimize-assets.mjs')
const r = spawnSync(process.execPath, [script], { stdio: 'inherit' })
process.exit(r.status ?? 1)
