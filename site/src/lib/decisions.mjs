import { readdirSync, readFileSync } from 'node:fs'

export const decisionsDir = 'docs/decisions'

export function decisions() {
  return readdirSync(decisionsDir)
    .filter((file) => /^\d+-.*\.md$/.test(file))
    .sort()
    .map((file) => {
      const text = readFileSync(`${decisionsDir}/${file}`, 'utf8')
      const status = text.split(/^## /m).find((section) => section.startsWith('Status'))
      return {
        slug: file.replace(/\.md$/, ''),
        title: text.split('\n', 1)[0].replace(/^# |[`*]/g, ''),
        date: text.match(/^Date: (.+)$/m)?.[1] ?? '',
        status: (status ?? '')
          .replace(/^Status/, '')
          .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
          .trim()
          .replace(/\n+/g, '; '),
      }
    })
}
