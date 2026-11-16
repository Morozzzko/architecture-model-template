import { AppsV1Api, BatchV1Api, CoreV1Api, KubeConfig } from '@kubernetes/client-node'

const uniqueSorted = values => [...new Set(values.filter(Boolean))].sort()
const namespaceConcurrency = 4
const targetTimeoutMs = 30_000

const mapConcurrent = async (values, concurrency, operation) => {
  const results = new Array(values.length)
  let next = 0
  const worker = async () => {
    while (next < values.length) {
      const index = next
      next += 1
      results[index] = await operation(values[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker))
  return results
}

const apiClientFactory = async (context, { signal, timeoutMs }) => {
  const kubeconfig = new KubeConfig()
  kubeconfig.loadFromDefault()
  kubeconfig.setCurrentContext(context)
  const apps = kubeconfig.makeApiClient(AppsV1Api)
  const batch = kubeconfig.makeApiClient(BatchV1Api)
  const core = kubeconfig.makeApiClient(CoreV1Api)
  const request = { timeoutSeconds: Math.max(1, Math.ceil(timeoutMs / 1_000)) }
  const options = {
    middleware: [{
      pre: async context => {
        context.setSignal(signal)
        return context
      },
      post: async context => context,
    }],
  }
  return {
    listNamespaces: async () => (await core.listNamespace(request, options)).items,
    listDeployments: async namespace => (await apps.listNamespacedDeployment({ ...request, namespace }, options)).items,
    listStatefulSets: async namespace => (await apps.listNamespacedStatefulSet({ ...request, namespace }, options)).items,
    listDaemonSets: async namespace => (await apps.listNamespacedDaemonSet({ ...request, namespace }, options)).items,
    listCronJobs: async namespace => (await batch.listNamespacedCronJob({ ...request, namespace }, options)).items,
    listReplicaSets: async namespace => (await apps.listNamespacedReplicaSet({ ...request, namespace }, options)).items,
    listJobs: async namespace => (await batch.listNamespacedJob({ ...request, namespace }, options)).items,
    listPods: async namespace => (await core.listNamespacedPod({ ...request, namespace }, options)).items,
  }
}

const ownerUid = resource => resource.metadata?.ownerReferences?.find(reference => reference.controller)?.uid
  ?? resource.metadata?.ownerReferences?.[0]?.uid

const desiredImages = (kind, resource) => {
  const template = kind === 'CronJob'
    ? resource.spec?.jobTemplate?.spec?.template
    : resource.spec?.template
  const containers = [
    ...(template?.spec?.initContainers ?? []),
    ...(template?.spec?.containers ?? []),
  ]
  return uniqueSorted(containers.map(container => container.image))
}

const replicaStatus = (kind, resource) => {
  const status = resource.status ?? {}
  if (kind === 'DaemonSet') {
    return Object.fromEntries([
      ['desired', status.desiredNumberScheduled],
      ['ready', status.numberReady],
      ['available', status.numberAvailable],
      ['updated', status.updatedNumberScheduled],
    ].filter(([, value]) => Number.isFinite(value)))
  }
  if (kind === 'CronJob') return {}
  return Object.fromEntries([
    ['desired', resource.spec?.replicas ?? status.replicas],
    ['ready', status.readyReplicas],
    ['available', status.availableReplicas],
    ['updated', status.updatedReplicas],
  ].filter(([, value]) => Number.isFinite(value)))
}

const normalizeWorkload = (namespace, kind, resource, annotation, ignoreAnnotation) => {
  const labels = resource.metadata?.labels ?? {}
  const annotations = resource.metadata?.annotations ?? {}
  const element = annotations[annotation]?.trim()
  const ignoreReason = ignoreAnnotation ? annotations[ignoreAnnotation]?.trim() : null
  if (element && ignoreReason) {
    throw new Error(`${kind} ${namespace}/${resource.metadata?.name} has both mapping and ignore annotations`)
  }
  return {
    uid: resource.metadata?.uid,
    namespace,
    kind,
    name: resource.metadata?.name,
    element,
    ignoreReason,
    version: labels['app.kubernetes.io/version'] ?? null,
    chart: labels['helm.sh/chart'] ?? null,
    desiredImages: desiredImages(kind, resource),
    observedImageIds: new Set(),
    replicas: replicaStatus(kind, resource),
  }
}

const listNamespaceResources = async (client, namespace, annotation, ignoreAnnotation) => {
  const [deployments, statefulSets, daemonSets, cronJobs, replicaSets, jobs, pods] = await Promise.all([
    client.listDeployments(namespace),
    client.listStatefulSets(namespace),
    client.listDaemonSets(namespace),
    client.listCronJobs(namespace),
    client.listReplicaSets(namespace),
    client.listJobs(namespace),
    client.listPods(namespace),
  ])
  const workloads = [
    ...deployments.map(resource => normalizeWorkload(namespace, 'Deployment', resource, annotation, ignoreAnnotation)),
    ...statefulSets.map(resource => normalizeWorkload(namespace, 'StatefulSet', resource, annotation, ignoreAnnotation)),
    ...daemonSets.map(resource => normalizeWorkload(namespace, 'DaemonSet', resource, annotation, ignoreAnnotation)),
    ...cronJobs.map(resource => normalizeWorkload(namespace, 'CronJob', resource, annotation, ignoreAnnotation)),
  ]
  const mappedByUid = new Map(workloads.filter(workload => workload.element).map(workload => [workload.uid, workload]))
  const childOwners = new Map()
  for (const resource of [...replicaSets, ...jobs]) {
    const workload = mappedByUid.get(ownerUid(resource))
    if (workload && resource.metadata?.uid) childOwners.set(resource.metadata.uid, workload)
  }
  for (const pod of pods) {
    if (pod.metadata?.deletionTimestamp || ['Failed', 'Succeeded'].includes(pod.status?.phase)) continue
    const uid = ownerUid(pod)
    const workload = mappedByUid.get(uid) ?? childOwners.get(uid)
    if (!workload) continue
    const statuses = [...(pod.status?.initContainerStatuses ?? []), ...(pod.status?.containerStatuses ?? [])]
    for (const status of statuses) {
      if (status.imageID) workload.observedImageIds.add(status.imageID)
    }
  }
  return workloads
}

const compareWorkloads = (left, right) => {
  const leftKey = [left.namespace, left.kind, left.name].join('\0')
  const rightKey = [right.namespace, right.kind, right.name].join('\0')
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0
}

export const discoverTarget = async (target, clientFactory = apiClientFactory, { timeoutMs = targetTimeoutMs } = {}) => {
  const controller = new AbortController()
  let timeout
  const discovery = async () => {
    const client = await clientFactory(target.context, { signal: controller.signal, timeoutMs })
    const available = uniqueSorted((await client.listNamespaces()).map(namespace => namespace.metadata?.name))
    const excluded = new Set(target.excludedNamespaces)
    const missingNamespaces = target.includedNamespaces === '*'
      ? []
      : target.includedNamespaces.filter(namespace => !available.includes(namespace))
    const included = target.includedNamespaces === '*'
      ? available
      : target.includedNamespaces.filter(namespace => available.includes(namespace))
    const namespaces = included.filter(namespace => !excluded.has(namespace))
    const workloads = (await mapConcurrent(namespaces, namespaceConcurrency, namespace =>
      listNamespaceResources(client, namespace, target.elementAnnotation, target.ignoreAnnotation),
    )).flat().sort(compareWorkloads)

    return {
      context: target.context,
      deploymentFqn: target.deploymentFqn,
      namespaces,
      missingNamespaces,
      workloads: workloads.filter(workload => workload.element).map(({ uid, observedImageIds, ignoreReason, ...workload }) => ({
        ...workload,
        observedImageIds: uniqueSorted([...observedImageIds]),
      })),
      ignored: workloads.filter(workload => !workload.element && workload.ignoreReason).map(workload => ({
        namespace: workload.namespace,
        kind: workload.kind,
        name: workload.name,
        reason: workload.ignoreReason,
      })),
      unmapped: workloads.filter(workload => !workload.element && !workload.ignoreReason).map(workload => ({
        namespace: workload.namespace,
        kind: workload.kind,
        name: workload.name,
      })),
    }
  }
  try {
    return await Promise.race([
      discovery(),
      new Promise((_, reject) => {
        timeout = setTimeout(() => {
          const error = new Error(`timed out after ${timeoutMs} ms`)
          reject(error)
          controller.abort(error)
        }, timeoutMs)
      }),
    ])
  } catch (error) {
    throw new Error(`Unable to read Kubernetes context ${target.context}: ${error.message}`, { cause: error })
  } finally {
    clearTimeout(timeout)
  }
}
