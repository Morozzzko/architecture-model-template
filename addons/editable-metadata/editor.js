import { randomUUID } from 'node:crypto'
import { globSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const properties = ['title', 'summary', 'description', 'technology', 'links']

const update = async (dir, fqn, patch, rewrite = (text) => text) => {
  const sources = Object.fromEntries(
    globSync('**/*.c4', { cwd: dir }).map((file) => [file, readFileSync(join(dir, file), 'utf8')]),
  )
  const { LikeC4Mutator } = await import('likec4-mutator')
  const mutator = LikeC4Mutator.fromFiles(sources)
  const { changedFiles } = mutator.updateElement(fqn, patch)
  const updated = mutator.serialize()
  for (const file of changedFiles) writeFileSync(join(dir, file), rewrite(updated[file]))
}

export async function setMetadata(dir, { fqn, key, value }) {
  const values = [value].flat().map((item) => (typeof item === 'string' ? item.trim() : item))
  if (typeof fqn !== 'string' || !/^[A-Za-z_][\w-]*$/.test(key) || values.some((item) => typeof item !== 'string')) {
    throw new Error('Expected { fqn, key, value } with an identifier as the key and a string or list of strings as the value')
  }
  const present = values.filter(Boolean)
  const stored = present.length ? (Array.isArray(value) ? present : present[0]) : null
  await update(dir, fqn, { metadata: { [key]: stored } })
}

// likec4-mutator writes a summary or description on one line, so a multi-line one goes in as a token and is swapped for a Markdown string.
const asMarkdown = (token, value) => (text) =>
  text.replace(new RegExp(`^([ \\t]*)(.*)'${token}'`, 'm'), (_, indent, before) => {
    const lines = value.split(/\r?\n/).map((line) => line && `${indent}  ${line.replace(/\\/g, '\\\\').replace(/'(?=')/g, "\\'")}`)
    return `${indent}${before}'''\n${lines.join('\n')}\n${indent}'''`
  })

export async function setProperty(dir, { fqn, property, value }) {
  if (typeof fqn !== 'string' || !properties.includes(property)) {
    throw new Error(`Expected { fqn, property, value } with one of ${properties.join(', ')} as the property`)
  }
  if (property === 'links') {
    const valid = Array.isArray(value) && value.every((link) => /^\S+$/.test(link?.url) && ['string', 'undefined'].includes(typeof link.label))
    if (!valid) throw new Error('Expected links as a list of { url, label } with no spaces in the url')
    return update(dir, fqn, { links: value.map(({ url, label }) => (label?.trim() ? { url, label: label.trim() } : { url })) })
  }
  if (typeof value !== 'string') throw new Error(`Expected ${property} as a string`)
  const text = value.trim()
  if (property === 'title' && !text) throw new Error('An element needs a title')
  if (!/\n/.test(text) || ['title', 'technology'].includes(property)) return update(dir, fqn, { [property]: text })
  const token = `editable${randomUUID().replaceAll('-', '')}`
  await update(dir, fqn, { [property]: token }, asMarkdown(token, text))
}

export const editor = ({ modelDir, fieldsFile, peopleFile }) => ({
  name: 'editable-metadata-editor',
  apply: 'serve',
  configureServer(server) {
    // Pages load the model once per module evaluation, so a changed model has to evict what was evaluated.
    server.watcher.add([modelDir, fieldsFile, peopleFile])
    server.watcher.on('change', (file) => {
      if (!file.endsWith('.c4') && file !== fieldsFile && file !== peopleFile) return
      for (const environment of Object.values(server.environments)) environment.moduleGraph.invalidateAll()
      server.ws.send({ type: 'full-reload' })
    })

    server.middlewares.use('/__model/element', async (req, res) => {
      // The endpoint writes to disk, so a page from another site must not be able to call it.
      if (req.method !== 'POST' || req.headers['sec-fetch-site'] !== 'same-origin') {
        res.statusCode = 403
        return res.end()
      }
      try {
        let body = ''
        for await (const chunk of req) body += chunk
        const change = JSON.parse(body)
        await ('property' in change ? setProperty : setMetadata)(modelDir, change)
        res.statusCode = 204
        res.end()
      } catch (error) {
        res.statusCode = 400
        res.end(error.message)
      }
    })
  },
})
