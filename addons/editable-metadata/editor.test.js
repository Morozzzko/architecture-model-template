import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { LikeC4 } from 'likec4'
import { setMetadata, setProperty } from './editor.js'

const source = `specification {
  element system
}

model {
  shop = system 'Shop' {
    description 'A shop.'
  }
}
`

const editIn = async (...changes) => {
  const dir = mkdtempSync(join(tmpdir(), 'editable-metadata-'))
  writeFileSync(join(dir, 'model.c4'), source)
  for (const change of changes) await ('property' in change ? setProperty : setMetadata)(dir, { fqn: 'shop', ...change })
  return dir
}
const edit = async (...changes) => readFileSync(join(await editIn(...changes), 'model.c4'), 'utf8')

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

test('the title and technology are written as strings', async () => {
  const model = await edit({ property: 'title', value: "Igor's shop" }, { property: 'technology', value: 'Node' })
  assert.match(model, /shop = system 'Igor\\'s shop'/)
  assert.match(model, /technology 'Node'/)
})

test('a multi-line description is written as a Markdown string that LikeC4 reads back', async () => {
  const description = "Sells things.\n\n- fast\n- it''s \\ cheap"
  const dir = await editIn({ property: 'description', value: description })
  const likec4 = await LikeC4.fromWorkspace(dir, { throwIfInvalid: true })
  const model = await likec4.computedModel()
  assert.deepEqual(model.element('shop').description.$source, { md: description })
})

test('links replace the links of the element', async () => {
  const model = await edit(
    { property: 'links', value: [{ url: 'https://a.example', label: 'Docs' }, { url: 'https://b.example', label: ' ' }] },
  )
  assert.match(model, /link https:\/\/a.example 'Docs'\n\s+link https:\/\/b.example\n/)
})

test('relative links are kept, before the edited links', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'editable-metadata-'))
  writeFileSync(join(dir, 'model.c4'), source)
  writeFileSync(join(dir, 'docs.c4'), "model {\n  extend shop {\n    link /shop/ 'Documentation'\n  }\n}\n")
  await setProperty(dir, { fqn: 'shop', property: 'links', value: [{ url: 'https://a.example' }] })
  const likec4 = await LikeC4.fromWorkspace(dir, { throwIfInvalid: true })
  const model = await likec4.computedModel()
  assert.deepEqual(model.element('shop').links.map(({ url }) => url), ['/shop/', 'https://a.example'])
})

test('a relative url in the links is refused', async () => {
  await assert.rejects(edit({ property: 'links', value: [{ url: '/shop/' }] }), /url/)
})

test('an empty title, a url with spaces and an unknown property are refused', async () => {
  await assert.rejects(edit({ property: 'title', value: ' ' }), /title/)
  await assert.rejects(edit({ property: 'links', value: [{ url: 'https://a.example x' }] }), /url/)
  await assert.rejects(edit({ property: 'kind', value: 'x' }), /property/)
})
