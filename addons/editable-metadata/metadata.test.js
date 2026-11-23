import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { LikeC4 } from 'likec4'
import { elementsWithMetadata, hrefWithBase, optionsOf, validateMetadataOptions } from './metadata.js'

const source = `specification {
  element system
  element container
}

model {
  shop = system 'Shop' {
    metadata {
      implementsContext 'orders'
    }

    api = container 'Shop API' {
      metadata {
        implementsContext ['orders', 'catalog']
      }
    }
  }
}
`

const model = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'editable-metadata-values-'))
  writeFileSync(join(dir, 'model.c4'), source)
  return (await LikeC4.fromWorkspace(dir, { throwIfInvalid: true })).computedModel()
}

test('finds elements whose scalar or list metadata contains a value', async () => {
  const computed = await model()

  assert.deepEqual(
    elementsWithMetadata(computed, 'implementsContext', 'orders').map(({ id }) => id),
    ['shop', 'shop.api'],
  )
  assert.deepEqual(
    elementsWithMetadata(computed, 'implementsContext', 'catalog').map(({ id }) => id),
    ['shop.api'],
  )
})

test('normalizes string and object options and keeps documentation links', () => {
  assert.deepEqual(
    optionsOf({
      type: 'multiselect',
      options: ['orders', { value: 'catalog', label: 'Product catalog', href: '/contexts/#catalog' }],
    }),
    [
      { value: 'orders', label: 'orders' },
      { value: 'catalog', label: 'Product catalog', href: '/contexts/#catalog' },
    ],
  )
})

test('prefixes site-root option links with the configured Astro base path', () => {
  assert.equal(hrefWithBase('/contexts/#orders', '/architecture/'), '/architecture/contexts/#orders')
  assert.equal(hrefWithBase('https://example.com/contexts', '/architecture/'), 'https://example.com/contexts')
})

test('rejects used metadata values that are not configured options', async () => {
  const computed = await model()

  assert.throws(
    () =>
      validateMetadataOptions(computed, 'implementsContext', {
        type: 'multiselect',
        options: [{ value: 'orders', label: 'Orders' }],
      }),
    /Unknown value "catalog" for metadata "implementsContext"\. Known values: orders/,
  )
})

test('requires configured options before reverse-querying metadata', async () => {
  const computed = await model()

  assert.throws(
    () => validateMetadataOptions(computed, 'implementsContext', { type: 'text' }),
    /Metadata "implementsContext" needs configured options/,
  )
})
