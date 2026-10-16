import assert from 'node:assert/strict'
import { test } from 'node:test'

test('adds a documentation link to the diagram viewer', async () => {
  const { injectDocumentationLink } = await import('./add-documentation-link.js').catch(() => ({}))

  assert.equal(typeof injectDocumentationLink, 'function', 'the diagram viewer enhancer is missing')

  const input = '<!doctype html><html><body><div id="root"></div></body></html>'
  const output = injectDocumentationLink(input)

  assert.match(output, /<a data-documentation-link href="\.\.\/">Back to Documentation<\/a>/)
  assert.doesNotMatch(output, /<a hidden/, 'the link is visible on pages without a Share button')
  assert.match(output, /<\/script>\n  <\/body><\/html>$/)
})
