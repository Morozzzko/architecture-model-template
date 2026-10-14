import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('./index.js', import.meta.url))
const create = (args, input = '') => {
  const directory = join(mkdtempSync(join(tmpdir(), 'create-architecture-model-')), 'shop')
  const result = spawnSync('node', [cli, directory, '--no-install', ...args], { input, encoding: 'utf8' })
  const read = (file) => readFileSync(join(directory, file), 'utf8')
  return { directory, read, ...result }
}

test('the name and description are written into the model and the site', () => {
  const { directory, read, status, stderr } = create([], "Shop\nIgor's online shop\n")
  assert.equal(status, 0, stderr)

  assert.match(read('model/model.c4'), /system = system 'Shop' \{\n\s+description 'Igor\\'s online shop'/)
  assert.match(read('astro.config.mjs'), /title: 'Shop',\n\s+description: 'Igor\\'s online shop',/)

  assert.ok(existsSync(join(directory, '.gitignore')))
  assert.ok(existsSync(join(directory, '.github/workflows/ci.yml')))
  assert.ok(existsSync(join(directory, '.git')))
})

test('without answers the project is named after the directory', () => {
  const { directory, read, status, stderr } = create(['--yes', '--no-git'])
  assert.equal(status, 0, stderr)

  assert.match(read('model/model.c4'), /system = system 'shop' \{\n\s+description 'A software system.'/)
  assert.match(read('astro.config.mjs'), /title: 'shop',\n\s+sidebar/)
  assert.ok(!existsSync(join(directory, '.git')))
})

test('--yes without a directory is refused instead of asking', () => {
  const { status, stderr } = spawnSync('node', [cli, '--yes'], { encoding: 'utf8' })
  assert.equal(status, 1)
  assert.match(stderr, /--yes needs a directory/)
})

test('a directory with files in it is refused', () => {
  const { directory } = create(['--yes'])
  const { status, stderr } = spawnSync('node', [cli, directory, '--yes'], { encoding: 'utf8' })
  assert.equal(status, 1)
  assert.match(stderr, /not empty/)
})
