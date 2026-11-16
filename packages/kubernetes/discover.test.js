import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { discoverTarget } from './lib/discover.js'

const owner = (kind, name, uid) => ({ kind, name, uid })
const metadata = (name, namespace, uid, annotations = {}, labels = {}, ownerReferences = []) => ({
  name,
  namespace,
  uid,
  annotations,
  labels,
  ownerReferences,
})
const podTemplate = (...images) => ({ spec: { containers: images.map((image, index) => ({ name: `c${index}`, image })) } })

const resources = {
  namespaces: ['payments', 'workers', 'monitoring'].map(name => ({ metadata: { name } })),
  deployments: {
    payments: [
      {
        metadata: metadata('api', 'payments', 'dep-api', { 'example.com/element': 'shop.api' }, {
          'app.kubernetes.io/version': '1.8.0',
          'helm.sh/chart': 'shop-2.4.0',
        }),
        spec: {
          replicas: 3,
          template: {
            ...podTemplate('registry/sidecar:2', 'registry/api:1.8.0'),
            spec: {
              ...podTemplate('registry/sidecar:2', 'registry/api:1.8.0').spec,
              initContainers: [{ name: 'migrate', image: 'registry/migrate:1' }],
            },
          },
        },
        status: { replicas: 3, readyReplicas: 2, availableReplicas: 2, updatedReplicas: 1 },
      },
      {
        metadata: metadata('unmapped', 'payments', 'dep-unmapped'),
        spec: { replicas: 1, template: podTemplate('registry/unmapped:1') },
        status: { replicas: 1, readyReplicas: 1 },
      },
      {
        metadata: metadata('ignored', 'payments', 'dep-ignored', {
          'example.com/ignore': 'platform-managed helper',
        }),
        spec: { replicas: 1, template: podTemplate('registry/ignored:1') },
        status: { replicas: 1, readyReplicas: 1 },
      },
    ],
    monitoring: [{
      metadata: metadata('metrics', 'monitoring', 'dep-metrics', { 'example.com/element': 'shop.metrics' }),
      spec: { replicas: 1, template: podTemplate('registry/metrics:1') },
      status: { replicas: 1, readyReplicas: 1 },
    }],
  },
  statefulSets: {
    payments: [{
      metadata: metadata('database', 'payments', 'sts-db', { 'example.com/element': 'shop.database' }),
      spec: { replicas: 2, template: podTemplate('registry/database:15') },
      status: { replicas: 2, readyReplicas: 2, currentReplicas: 2, updatedReplicas: 2 },
    }],
  },
  daemonSets: {
    workers: [{
      metadata: metadata('agent', 'workers', 'ds-agent', { 'example.com/element': 'shop.agent' }),
      spec: { template: podTemplate('registry/agent:4') },
      status: { desiredNumberScheduled: 4, numberReady: 3, numberAvailable: 3, updatedNumberScheduled: 4 },
    }],
  },
  cronJobs: {
    workers: [{
      metadata: metadata('cleanup', 'workers', 'cron-cleanup', { 'example.com/element': 'shop.cleanup' }),
      spec: { jobTemplate: { spec: { template: podTemplate('registry/cleanup:7') } } },
      status: {},
    }],
  },
  replicaSets: {
    payments: [
      { metadata: metadata('api-old', 'payments', 'rs-old', {}, {}, [owner('Deployment', 'api', 'dep-api')]) },
      { metadata: metadata('api-new', 'payments', 'rs-new', {}, {}, [owner('Deployment', 'api', 'dep-api')]) },
    ],
  },
  jobs: {
    workers: [{
      metadata: metadata('cleanup-1', 'workers', 'job-cleanup', {}, {}, [owner('CronJob', 'cleanup', 'cron-cleanup')]),
      status: { active: 1 },
    }],
  },
  pods: {
    payments: [
      {
        metadata: metadata('api-old-1', 'payments', 'pod-old', {}, {}, [owner('ReplicaSet', 'api-old', 'rs-old')]),
        status: { phase: 'Running', containerStatuses: [{ imageID: 'registry/api@sha256:bbb' }] },
      },
      {
        metadata: metadata('api-new-1', 'payments', 'pod-new', {}, {}, [owner('ReplicaSet', 'api-new', 'rs-new')]),
        status: { phase: 'Running', containerStatuses: [
          { imageID: 'registry/api@sha256:aaa' },
          { imageID: 'registry/sidecar@sha256:ccc' },
        ] },
      },
      {
        metadata: metadata('database-0', 'payments', 'pod-db', {}, {}, [owner('StatefulSet', 'database', 'sts-db')]),
        status: { phase: 'Running', containerStatuses: [{ imageID: 'registry/database@sha256:ddd' }] },
      },
    ],
    workers: [
      {
        metadata: metadata('agent-a', 'workers', 'pod-agent', {}, {}, [owner('DaemonSet', 'agent', 'ds-agent')]),
        status: { phase: 'Running', containerStatuses: [{ imageID: 'registry/agent@sha256:eee' }] },
      },
      {
        metadata: metadata('cleanup-1-a', 'workers', 'pod-cleanup', {}, {}, [owner('Job', 'cleanup-1', 'job-cleanup')]),
        status: { phase: 'Running', containerStatuses: [{ imageID: 'registry/cleanup@sha256:fff' }] },
      },
      {
        metadata: metadata('cleanup-old', 'workers', 'pod-cleanup-old', {}, {}, [owner('Job', 'cleanup-1', 'job-cleanup')]),
        status: { phase: 'Succeeded', containerStatuses: [{ imageID: 'registry/cleanup@sha256:old' }] },
      },
    ],
  },
}

const clientFactory = async () => ({
  listNamespaces: async () => resources.namespaces,
  listDeployments: async namespace => resources.deployments[namespace] ?? [],
  listStatefulSets: async namespace => resources.statefulSets[namespace] ?? [],
  listDaemonSets: async namespace => resources.daemonSets[namespace] ?? [],
  listCronJobs: async namespace => resources.cronJobs[namespace] ?? [],
  listReplicaSets: async namespace => resources.replicaSets[namespace] ?? [],
  listJobs: async namespace => resources.jobs[namespace] ?? [],
  listPods: async namespace => resources.pods[namespace] ?? [],
})

const target = {
  deploymentFqn: 'production.eu',
  context: 'production-eu',
  includedNamespaces: '*',
  excludedNamespaces: ['monitoring'],
  elementAnnotation: 'example.com/element',
  ignoreAnnotation: 'example.com/ignore',
  authoredNamespaces: {},
}

const withKubernetesApi = async (handler, operation) => {
  const server = createServer(handler)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const workspace = await mkdtemp(join(tmpdir(), 'architecture-model-kubernetes-client-'))
  const kubeconfig = join(workspace, 'config.json')
  const previous = process.env.KUBECONFIG
  const address = server.address()
  await writeFile(kubeconfig, JSON.stringify({
    apiVersion: 'v1',
    kind: 'Config',
    clusters: [{
      name: 'test',
      cluster: { server: `http://127.0.0.1:${address.port}`, 'insecure-skip-tls-verify': true },
    }],
    contexts: [{ name: target.context, context: { cluster: 'test', user: 'test' } }],
    'current-context': target.context,
    users: [{ name: 'test', user: { token: 'test-token' } }],
  }))
  process.env.KUBECONFIG = kubeconfig
  try {
    return await operation()
  } finally {
    if (previous === undefined) delete process.env.KUBECONFIG
    else process.env.KUBECONFIG = previous
    server.closeAllConnections()
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
}

test('discovers supported mapped workloads and derives rollout metadata', async () => {
  const snapshot = await discoverTarget(target, clientFactory)

  assert.deepEqual(snapshot, {
    context: 'production-eu',
    deploymentFqn: 'production.eu',
    namespaces: ['payments', 'workers'],
    missingNamespaces: [],
    workloads: [
      {
        namespace: 'payments',
        kind: 'Deployment',
        name: 'api',
        element: 'shop.api',
        version: '1.8.0',
        chart: 'shop-2.4.0',
        desiredImages: ['registry/api:1.8.0', 'registry/migrate:1', 'registry/sidecar:2'],
        observedImageIds: ['registry/api@sha256:aaa', 'registry/api@sha256:bbb', 'registry/sidecar@sha256:ccc'],
        replicas: { desired: 3, ready: 2, available: 2, updated: 1 },
      },
      {
        namespace: 'payments',
        kind: 'StatefulSet',
        name: 'database',
        element: 'shop.database',
        version: null,
        chart: null,
        desiredImages: ['registry/database:15'],
        observedImageIds: ['registry/database@sha256:ddd'],
        replicas: { desired: 2, ready: 2, updated: 2 },
      },
      {
        namespace: 'workers',
        kind: 'CronJob',
        name: 'cleanup',
        element: 'shop.cleanup',
        version: null,
        chart: null,
        desiredImages: ['registry/cleanup:7'],
        observedImageIds: ['registry/cleanup@sha256:fff'],
        replicas: {},
      },
      {
        namespace: 'workers',
        kind: 'DaemonSet',
        name: 'agent',
        element: 'shop.agent',
        version: null,
        chart: null,
        desiredImages: ['registry/agent:4'],
        observedImageIds: ['registry/agent@sha256:eee'],
        replicas: { desired: 4, ready: 3, available: 3, updated: 4 },
      },
    ],
    ignored: [{
      namespace: 'payments',
      kind: 'Deployment',
      name: 'ignored',
      reason: 'platform-managed helper',
    }],
    unmapped: [{ namespace: 'payments', kind: 'Deployment', name: 'unmapped' }],
  })
})

test('uses the Kubernetes client for authenticated API discovery', async () => {
  const requests = []
  const responses = new Map([
    ['/api/v1/namespaces', [{ metadata: { name: 'apps' } }]],
    ['/apis/apps/v1/namespaces/apps/deployments', [{
      metadata: metadata('api', 'apps', 'dep-api', { 'example.com/element': 'shop.api' }),
      spec: { replicas: 1, template: podTemplate('registry/api:1') },
      status: { replicas: 1, readyReplicas: 1 },
    }]],
    ['/apis/apps/v1/namespaces/apps/statefulsets', []],
    ['/apis/apps/v1/namespaces/apps/daemonsets', []],
    ['/apis/batch/v1/namespaces/apps/cronjobs', []],
    ['/apis/apps/v1/namespaces/apps/replicasets', []],
    ['/apis/batch/v1/namespaces/apps/jobs', []],
    ['/api/v1/namespaces/apps/pods', []],
  ])

  const snapshot = await withKubernetesApi((request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname
    requests.push({ path, authorization: request.headers.authorization })
    const items = responses.get(path)
    response.writeHead(items ? 200 : 404, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ apiVersion: 'v1', kind: 'List', items: items ?? [] }))
  }, () => discoverTarget({
    ...target,
    includedNamespaces: ['apps'],
    excludedNamespaces: [],
  }))

  assert.deepEqual(requests.map(request => request.path).sort(), [...responses.keys()].sort())
  assert.equal(requests.every(request => request.authorization === 'Bearer test-token'), true)
  assert.deepEqual(snapshot.workloads.map(workload => workload.name), ['api'])
})

test('aborts a Kubernetes client request when discovery times out', async () => {
  let aborted
  const requestAborted = new Promise(resolve => { aborted = resolve })

  await withKubernetesApi((request, response) => {
    request.once('aborted', aborted)
    response.once('close', aborted)
  }, async () => {
    await assert.rejects(discoverTarget({
      ...target,
      includedNamespaces: ['apps'],
      excludedNamespaces: [],
    }, undefined, { timeoutMs: 10 }), /timed out.*production-eu|production-eu.*timed out/i)
    await requestAborted
  })
})

test('uses the explicit namespace scope before discovering resources', async () => {
  const snapshot = await discoverTarget({
    ...target,
    includedNamespaces: ['payments', 'workers'],
    excludedNamespaces: ['workers'],
  }, clientFactory)

  assert.deepEqual(snapshot.namespaces, ['payments'])
  assert.deepEqual(snapshot.missingNamespaces, [])
  assert.equal(snapshot.workloads.every(workload => workload.namespace === 'payments'), true)
})

test('bounds namespace list concurrency for a context', async () => {
  let active = 0
  let maximum = 0
  const list = async () => {
    active += 1
    maximum = Math.max(maximum, active)
    await new Promise(resolve => setImmediate(resolve))
    active -= 1
    return []
  }
  const namespaces = Array.from({ length: 8 }, (_, index) => ({ metadata: { name: `namespace-${index}` } }))

  await discoverTarget(target, async () => ({
    listNamespaces: async () => namespaces,
    listDeployments: list,
    listStatefulSets: list,
    listDaemonSets: list,
    listCronJobs: list,
    listReplicaSets: list,
    listJobs: list,
    listPods: list,
  }))

  assert.equal(maximum <= 28, true)
})

test('reports explicitly configured namespaces that do not exist', async () => {
  const snapshot = await discoverTarget({
    ...target,
    includedNamespaces: ['payments', 'missing'],
    excludedNamespaces: [],
  }, clientFactory)

  assert.deepEqual(snapshot.namespaces, ['payments'])
  assert.deepEqual(snapshot.missingNamespaces, ['missing'])
})

test('records omitted replica counters as zero after a controller reports status', async () => {
  const snapshot = await discoverTarget({
    ...target,
    includedNamespaces: ['payments'],
    excludedNamespaces: [],
  }, async () => ({
    ...await clientFactory(),
    listDeployments: async () => [{
      metadata: metadata('starting', 'payments', 'dep-starting', { 'example.com/element': 'shop.api' }),
      spec: { replicas: 2, template: podTemplate('registry/api:1') },
      status: { observedGeneration: 1 },
    }],
    listStatefulSets: async () => [],
    listReplicaSets: async () => [],
    listPods: async () => [],
  }))

  assert.deepEqual(snapshot.workloads[0].replicas, {
    desired: 2,
    ready: 0,
    available: 0,
    updated: 0,
  })
})

test('rejects a controller with both mapping and ignore annotations', async () => {
  await assert.rejects(discoverTarget({
    ...target,
    includedNamespaces: ['payments'],
    excludedNamespaces: [],
  }, async () => {
    const client = await clientFactory()
    return {
      ...client,
      listDeployments: async () => [{
        metadata: metadata('ambiguous', 'payments', 'dep-ambiguous', {
          'example.com/element': 'shop.api',
          'example.com/ignore': 'not significant',
        }),
        spec: { replicas: 1, template: podTemplate('registry/api:1') },
        status: { replicas: 1 },
      }],
    }
  }), /both mapping and ignore annotations/)
})

test('normalizes context access failures', async () => {
  await assert.rejects(
    discoverTarget(target, async () => { throw new Error('forbidden') }),
    /production-eu.*forbidden/,
  )
})

test('aborts remaining requests when a context read fails', async () => {
  let signal
  await assert.rejects(discoverTarget(target, async (context, options) => {
    signal = options.signal
    return {
      ...await clientFactory(),
      listDeployments: async () => { throw new Error('list failed') },
    }
  }), /list failed/)

  assert.equal(signal.aborted, true)
})

test('times out a stalled Kubernetes context', async () => {
  const slowClientFactory = async () => ({
    ...await clientFactory(),
    listNamespaces: async () => new Promise(resolve => setTimeout(() => resolve(resources.namespaces), 100)),
  })

  await assert.rejects(
    discoverTarget(target, slowClientFactory, { timeoutMs: 10 }),
    /timed out.*production-eu|production-eu.*timed out/i,
  )
})
