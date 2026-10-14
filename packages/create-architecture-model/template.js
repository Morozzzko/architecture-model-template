import { cpSync, existsSync, renameSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const bundled = join(here, 'template')
const source = join(here, '../../template')
const generated = ['node_modules', 'dist', '.astro']

const copy = (from, to) =>
  cpSync(from, to, { recursive: true, filter: (path) => !generated.includes(basename(path)) })

// npm leaves .gitignore files out of published packages, so the bundled copy carries it under another name.
export function bundle() {
  copy(source, bundled)
  renameSync(join(bundled, '.gitignore'), join(bundled, '_gitignore'))
}

export function copyTemplate(to) {
  copy(existsSync(bundled) ? bundled : source, to)
  if (existsSync(join(to, '_gitignore'))) renameSync(join(to, '_gitignore'), join(to, '.gitignore'))
}
