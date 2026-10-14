import { cpSync, existsSync, renameSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const bundled = join(here, 'template')
const source = join(here, '../../template')
const generated = ['node_modules', 'dist', '.astro']
// npm and pnpm leave these out of published packages, so the bundled copy carries them under another name.
const unpublishable = ['.gitignore', 'package-lock.json']

const copy = (from, to) =>
  cpSync(from, to, { recursive: true, filter: (path) => !generated.includes(basename(path)) })

export function bundle() {
  copy(source, bundled)
  for (const file of unpublishable) renameSync(join(bundled, file), join(bundled, `_${file}`))
}

export function copyTemplate(to) {
  copy(existsSync(bundled) ? bundled : source, to)
  for (const file of unpublishable) {
    if (existsSync(join(to, `_${file}`))) renameSync(join(to, `_${file}`), join(to, file))
  }
}
