import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, stat, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { replaceIfChanged, validateCandidate } from './lib/validate.js'

const authored = `specification {
  element system
  deploymentNode environment
  deploymentNode namespace
}

model {
  app = system 'Application'
}

deployment {
  environment production
}
`

const oldGenerated = `deployment {
  extend production {
    namespace old {
      instanceOf app
    }
  }
}
`

const candidate = `deployment {
  extend production {
    namespace current {
      instanceOf app
    }
  }
}
`

const fixture = async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'architecture-model-kubernetes-'))
  const output = join(workspace, 'deployment.generated.c4')
  await writeFile(join(workspace, 'model.c4'), authored)
  await writeFile(output, oldGenerated)
  return { workspace, output }
}

test('validates a candidate without loading the current generated declarations', async () => {
  const { workspace, output } = await fixture()

  await validateCandidate({ workspace, output, source: candidate })

  assert.equal(await readFile(output, 'utf8'), oldGenerated)
})

test('rejects an invalid candidate without changing the current output', async () => {
  const { workspace, output } = await fixture()
  const invalid = candidate.replace('instanceOf app', 'instanceOf missing')

  await assert.rejects(validateCandidate({ workspace, output, source: invalid }))
  assert.equal(await readFile(output, 'utf8'), oldGenerated)
})

test('does not rewrite unchanged output', async () => {
  const { output } = await fixture()
  const oldTime = new Date('2025-01-01T00:00:00Z')
  await utimes(output, oldTime, oldTime)

  const result = await replaceIfChanged({ output, source: oldGenerated })

  assert.equal(result, 'unchanged')
  assert.equal((await stat(output)).mtime.toISOString(), oldTime.toISOString())
})

test('atomically replaces changed output without leaving a temporary file', async () => {
  const { workspace, output } = await fixture()

  const result = await replaceIfChanged({ output, source: candidate })

  assert.equal(result, 'changed')
  assert.equal(await readFile(output, 'utf8'), candidate)
  assert.deepEqual((await readdir(workspace)).sort(), ['deployment.generated.c4', 'model.c4'])
})
