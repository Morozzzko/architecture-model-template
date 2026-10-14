import { globSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export async function setMetadata(dir, { fqn, key, value }) {
  const values = [value].flat().map((item) => (typeof item === 'string' ? item.trim() : item))
  if (typeof fqn !== 'string' || !/^[A-Za-z_][\w-]*$/.test(key) || values.some((item) => typeof item !== 'string')) {
    throw new Error('Expected { fqn, key, value } with an identifier as the key and a string or list of strings as the value')
  }
  const present = values.filter(Boolean)
  const stored = present.length ? (Array.isArray(value) ? present : present[0]) : null

  const sources = Object.fromEntries(
    globSync('**/*.c4', { cwd: dir }).map((file) => [file, readFileSync(join(dir, file), 'utf8')]),
  )
  const { LikeC4Mutator } = await import('likec4-mutator')
  const mutator = LikeC4Mutator.fromFiles(sources)
  const { changedFiles } = mutator.updateElement(fqn, { metadata: { [key]: stored } })
  const updated = mutator.serialize()
  for (const file of changedFiles) writeFileSync(join(dir, file), updated[file])
}

export const editor = ({ modelDir, fieldsFile }) => ({
  name: 'editable-metadata-editor',
  apply: 'serve',
  configureServer(server) {
    // Pages load the model once per module evaluation, so a changed model has to evict what was evaluated.
    server.watcher.add([modelDir, fieldsFile])
    server.watcher.on('change', (file) => {
      if (!file.endsWith('.c4') && file !== fieldsFile) return
      for (const environment of Object.values(server.environments)) environment.moduleGraph.invalidateAll()
      server.ws.send({ type: 'full-reload' })
    })

    server.middlewares.use('/__model/metadata', async (req, res) => {
      // The endpoint writes to disk, so a page from another site must not be able to call it.
      if (req.method !== 'POST' || req.headers['sec-fetch-site'] !== 'same-origin') {
        res.statusCode = 403
        return res.end()
      }
      try {
        let body = ''
        for await (const chunk of req) body += chunk
        await setMetadata(modelDir, JSON.parse(body))
        res.statusCode = 204
        res.end()
      } catch (error) {
        res.statusCode = 400
        res.end(error.message)
      }
    })
  },
})
