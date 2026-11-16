import assert from 'node:assert/strict'
import { test } from 'node:test'
import { run } from './index.js'

const capture = () => {
  const stdout = []
  const stderr = []
  return {
    stdout,
    stderr,
    writeOut: line => stdout.push(line),
    writeError: line => stderr.push(line),
  }
}

test('reports discovery counts and every unmapped workload', async () => {
  const output = capture()
  const discoverFn = async ({ workspace }) => ({
    workspace,
    summary: { targets: 2, mapped: 4, ignored: 1, unmapped: 1 },
    snapshots: [{
      context: 'production-eu',
      workloads: [{ namespace: 'payments', kind: 'Deployment', name: 'api', element: 'shop.api' }],
      ignored: [{ namespace: 'payments', kind: 'Deployment', name: 'helper', reason: 'platform managed' }],
      unmapped: [{ namespace: 'payments', kind: 'Deployment', name: 'unknown' }],
    }],
    failures: [],
  })

  const exitCode = await run(['discover', 'architecture'], { discoverFn, ...output })

  assert.equal(exitCode, 0)
  assert.deepEqual(output.stdout, [
    'Discovered 2 targets: 4 mapped, 1 ignored, 1 unmapped',
    'Mapped production-eu Deployment payments/api -> shop.api',
    'Ignored production-eu Deployment payments/helper: platform managed',
    'Unmapped production-eu Deployment payments/unknown',
  ])
  assert.deepEqual(output.stderr, [])
})

test('sync defaults to the model workspace and its generated output', async () => {
  const output = capture()
  const syncFn = async options => ({ ...options, status: 'unchanged', summary: { targets: 1, mapped: 2, ignored: 0, unmapped: 0 } })

  const exitCode = await run(['sync'], { syncFn, ...output })

  assert.equal(exitCode, 0)
  assert.deepEqual(output.stdout, ['Deployment snapshot unchanged: model/deployment.generated.c4 (1 target, 2 mapped, 0 ignored, 0 unmapped)'])
  assert.deepEqual(output.stderr, [])
})

test('reports every discovery failure after printing successful results', async () => {
  const output = capture()
  const discoverFn = async () => ({
    summary: { targets: 2, mapped: 1, ignored: 0, unmapped: 0 },
    snapshots: [{
      context: 'production-eu',
      workloads: [{ namespace: 'payments', kind: 'Deployment', name: 'api', element: 'shop.api' }],
      ignored: [],
      unmapped: [],
    }],
    failures: [{
      context: 'production-us',
      deploymentFqn: 'production.us',
      message: 'Unable to read Kubernetes context production-us: forbidden',
    }],
  })

  const exitCode = await run(['discover'], { discoverFn, ...output })

  assert.equal(exitCode, 1)
  assert.deepEqual(output.stdout, [
    'Discovered 2 targets: 1 mapped, 0 ignored, 0 unmapped',
    'Mapped production-eu Deployment payments/api -> shop.api',
  ])
  assert.deepEqual(output.stderr, ['Unable to read Kubernetes context production-us: forbidden'])
})

test('returns a clear error for a missing command', async () => {
  const output = capture()

  const exitCode = await run([], output)

  assert.equal(exitCode, 1)
  assert.deepEqual(output.stdout, [])
  assert.match(output.stderr[0], /discover|sync/)
})

test('returns configuration and cluster access errors without a stack trace', async () => {
  for (const message of [
    'Invalid Kubernetes target production: kubernetesNamespaces',
    'Unable to read Kubernetes context production-eu: forbidden',
  ]) {
    const output = capture()
    const exitCode = await run(['sync'], {
      syncFn: async () => { throw new Error(message) },
      ...output,
    })

    assert.equal(exitCode, 1)
    assert.deepEqual(output.stderr, [message])
  }
})
