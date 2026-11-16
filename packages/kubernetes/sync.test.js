import assert from 'node:assert/strict'
import { access, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { discover, sync } from './lib/sync.js'
import { generatedHeader } from './lib/generated.js'

const source = `specification {
  element system
  deploymentNode environment
  deploymentNode cluster
  deploymentNode namespace
}

model {
  api = system
  worker = system
}

deployment {
  environment production {
    cluster eu {
      metadata {
        kubernetesContext 'cluster-eu'
        kubernetesNamespaces '*'
        kubernetesElementAnnotation 'example.com/element'
      }
    }
    cluster us {
      metadata {
        kubernetesContext 'cluster-us'
        kubernetesNamespaces '*'
        kubernetesElementAnnotation 'example.com/element'
      }
    }
  }
}
`

const fixture = async (modelSource = source) => {
  const workspace = await mkdtemp(join(tmpdir(), 'architecture-model-kubernetes-sync-'))
  await writeFile(join(workspace, 'model.c4'), modelSource)
  return { workspace, output: join(workspace, 'deployment.generated.c4') }
}

const deployment = (context, mapped = true) => ({
  metadata: {
    name: context === 'cluster-eu' ? 'api' : 'worker',
    namespace: 'apps',
    uid: `uid-${context}`,
    annotations: mapped ? { 'example.com/element': context === 'cluster-eu' ? 'api' : 'worker' } : {},
    labels: {},
  },
  spec: { replicas: 1, template: { spec: { containers: [{ name: 'app', image: `registry/${context}:1` }] } } },
  status: { readyReplicas: 1, availableReplicas: 1, updatedReplicas: 1 },
})

const clientFor = (context, includeUnmapped = false) => ({
  listNamespaces: async () => [{ metadata: { name: 'apps' } }],
  listDeployments: async () => [deployment(context), ...(includeUnmapped ? [deployment(context, false)] : [])],
  listStatefulSets: async () => [],
  listDaemonSets: async () => [],
  listCronJobs: async () => [],
  listReplicaSets: async () => [],
  listJobs: async () => [],
  listPods: async () => [],
})

test('discovers every target concurrently and reports unmapped workloads without writing', async () => {
  const { workspace, output } = await fixture()
  let started = 0
  let release
  const bothStarted = new Promise(resolve => { release = resolve })
  const clientFactory = async context => {
    started += 1
    if (started === 2) release()
    await bothStarted
    return clientFor(context, context === 'cluster-eu')
  }

  const report = await discover({ workspace, clientFactory })

  assert.equal(report.summary.targets, 2)
  assert.equal(report.summary.mapped, 2)
  assert.equal(report.summary.ignored, 0)
  assert.equal(report.summary.unmapped, 1)
  assert.deepEqual(report.failures, [])
  assert.deepEqual(report.snapshots.map(snapshot => snapshot.context), ['cluster-eu', 'cluster-us'])
  assert.deepEqual(report.snapshots[0].unmapped, [{ namespace: 'apps', kind: 'Deployment', name: 'api' }])
  await assert.rejects(access(output), error => error.code === 'ENOENT')
})

test('discovery ignores a stale generated snapshot', async () => {
  const { workspace, output } = await fixture()
  await writeFile(output, `${generatedHeader}

deployment {
  extend production.eu {
    namespace stale {
      instanceOf missing
    }
  }
}
`)

  const report = await discover({ workspace, clientFactory: async context => clientFor(context) })

  assert.equal(report.summary.mapped, 2)
})

test('discovery ignores the configured custom generated snapshot', async () => {
  const { workspace } = await fixture()
  const output = join(workspace, 'observed-deployment.c4')
  await writeFile(output, `${generatedHeader}

deployment {
  extend production.eu {
    namespace stale {
      instanceOf missing
    }
  }
}
`)

  const report = await discover({ workspace, output, clientFactory: async context => clientFor(context) })

  assert.equal(report.summary.mapped, 2)
})

test('does not replace the previous snapshot when one target is inaccessible', async () => {
  const { workspace, output } = await fixture()
  const previous = `${generatedHeader}\n\ndeployment {}\n`
  await writeFile(output, previous)
  const clientFactory = async context => {
    if (context === 'cluster-us') throw new Error('forbidden')
    return clientFor(context)
  }

  await assert.rejects(sync({ workspace, output, clientFactory }), /cluster-us.*forbidden/)
  assert.equal(await readFile(output, 'utf8'), previous)
})

test('does not replace the previous snapshot when a controller is unmapped', async () => {
  const { workspace, output } = await fixture()
  const previous = `${generatedHeader}\n\ndeployment {}\n`
  await writeFile(output, previous)

  await assert.rejects(
    sync({
      workspace,
      output,
      clientFactory: async context => clientFor(context, context === 'cluster-eu'),
    }),
    /Deployment apps\/api.*neither mapped nor ignored/,
  )
  assert.equal(await readFile(output, 'utf8'), previous)
})

test('validates before replacing the previous snapshot', async () => {
  const { workspace, output } = await fixture()
  const previous = `${generatedHeader}\n\ndeployment {}\n`
  await writeFile(output, previous)

  await assert.rejects(sync({
    workspace,
    output,
    clientFactory: async context => clientFor(context),
    validateCandidateFn: async () => { throw new Error('candidate invalid') },
  }), /candidate invalid/)
  assert.equal(await readFile(output, 'utf8'), previous)
})

test('reports every inaccessible target while discovery preserves successful snapshots', async () => {
  const { workspace } = await fixture()
  const report = await discover({
    workspace,
    clientFactory: async context => {
      if (context === 'cluster-us') throw new Error('us forbidden')
      return clientFor(context)
    },
  })

  assert.equal(report.summary.targets, 2)
  assert.deepEqual(report.snapshots.map(snapshot => snapshot.context), ['cluster-eu'])
  assert.deepEqual(report.failures, [{
    context: 'cluster-us',
    deploymentFqn: 'production.us',
    message: 'Unable to read Kubernetes context cluster-us: us forbidden',
  }])
})

test('sync aggregates every target failure and preserves the previous snapshot', async () => {
  const { workspace, output } = await fixture()
  const previous = `${generatedHeader}\n\ndeployment {}\n`
  await writeFile(output, previous)

  await assert.rejects(
    sync({
      workspace,
      output,
      clientFactory: async context => { throw new Error(`${context} forbidden`) },
    }),
    error => error.message.includes('cluster-eu forbidden') && error.message.includes('cluster-us forbidden'),
  )
  assert.equal(await readFile(output, 'utf8'), previous)
})

test('refuses authored files at default and custom output paths before cluster access', async () => {
  const { workspace, output } = await fixture()
  let accessed = false
  const clientFactory = async context => {
    accessed = true
    return clientFor(context)
  }

  await writeFile(output, 'deployment { environment authored }\n')
  await assert.rejects(sync({ workspace, clientFactory }), /not owned/)

  const model = join(workspace, 'model.c4')
  const authoredModel = await readFile(model, 'utf8')
  await assert.rejects(sync({ workspace, output: model, clientFactory }), /not owned/)

  assert.equal(accessed, false)
  assert.equal(await readFile(output, 'utf8'), 'deployment { environment authored }\n')
  assert.equal(await readFile(model, 'utf8'), authoredModel)
})

test('rejects unsupported output extensions before cluster access', async () => {
  const { workspace } = await fixture()
  let accessed = false

  await assert.rejects(sync({
    workspace,
    output: join(workspace, 'deployment.generated.txt'),
    clientFactory: async context => {
      accessed = true
      return clientFor(context)
    },
  }), /\.c4.*\.likec4|\.likec4.*\.c4/)
  assert.equal(accessed, false)
})

test('discover and sync reject a workspace without synchronization targets', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'architecture-model-kubernetes-empty-'))
  await writeFile(join(workspace, 'model.c4'), `specification { element system }\nmodel { app = system }\n`)

  await assert.rejects(discover({ workspace }), /no Kubernetes synchronization targets/i)
  await assert.rejects(sync({ workspace }), /no Kubernetes synchronization targets/i)
  await assert.rejects(access(join(workspace, 'deployment.generated.c4')), error => error.code === 'ENOENT')
})

test('reports unknown logical element mappings during discovery', async () => {
  const { workspace } = await fixture()
  const report = await discover({
    workspace,
    clientFactory: async context => ({
      ...clientFor(context),
      listDeployments: async () => [{
        ...deployment(context),
        metadata: {
          ...deployment(context).metadata,
          annotations: { 'example.com/element': 'missing.element' },
        },
      }],
    }),
  })

  assert.equal(report.failures.length, 2)
  assert.equal(report.failures.every(failure => failure.message.includes('missing.element')), true)
})

test('refuses synchronization when an explicitly configured namespace is missing', async () => {
  const explicitSource = source.replaceAll("kubernetesNamespaces '*'", "kubernetesNamespaces ['apps', 'missing']")
  const { workspace, output } = await fixture(explicitSource)

  await assert.rejects(
    sync({ workspace, output, clientFactory: async context => clientFor(context) }),
    /missing.*namespace|namespace.*missing/,
  )
  await assert.rejects(access(output), error => error.code === 'ENOENT')
})

test('uses the workspace output by default and reports an unchanged second sync', async () => {
  const { workspace, output } = await fixture()
  const options = { workspace, clientFactory: async context => clientFor(context) }

  const first = await sync(options)
  const second = await sync(options)

  assert.equal(first.output, output)
  assert.equal(first.status, 'changed')
  assert.equal(second.status, 'unchanged')
  assert.match(await readFile(output, 'utf8'), /Generated by @architecture-model\/kubernetes/)
})
