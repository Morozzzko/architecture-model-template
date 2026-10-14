import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { setMetadata } from './editor.js'

const source = `specification {
  element system
}

model {
  shop = system 'Shop' {
    description 'A shop.'
  }
}
`

const edit = async (...changes) => {
  const dir = mkdtempSync(join(tmpdir(), 'editable-metadata-'))
  writeFileSync(join(dir, 'model.c4'), source)
  for (const change of changes) await setMetadata(dir, { fqn: 'shop', ...change })
  return readFileSync(join(dir, 'model.c4'), 'utf8')
}

test('a value is written into a new metadata block, with quotes escaped', async () => {
  const model = await edit({ key: 'owner', value: "Igor's team" })
  assert.match(model, /metadata \{\n\s+owner 'Igor\\'s team'\n\s+\}/)
  assert.match(model, /description 'A shop.'/)
})

test('a list is written as an array and replaced by the next edit', async () => {
  const model = await edit({ key: 'languages', value: ['Go', 'Python'] }, { key: 'languages', value: ['Go'] })
  assert.match(model, /languages \[\s*'Go'\s*\]/)
  assert.doesNotMatch(model, /Python/)
})

test('an empty value removes the key', async () => {
  const model = await edit({ key: 'owner', value: 'igor' }, { key: 'tier', value: '1' }, { key: 'owner', value: ' ' })
  assert.doesNotMatch(model, /owner/)
  assert.match(model, /tier '1'/)
})

test('a key that is not an identifier is refused', async () => {
  await assert.rejects(edit({ key: "owner 'x'\n evil", value: 'igor' }), /identifier/)
})
