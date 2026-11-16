import { AppsV1Api, BatchV1Api, CoreV1Api, KubeConfig } from '@kubernetes/client-node'

const uniqueSorted = values => [...new Set(values.filter(Boolean))].sort()

const apiClientFactory = async context => {
  const kubeconfig = new KubeConfig()
  kubeconfig.loadFromDefault()
  kubeconfig.setCurrentContext(context)
  const apps = kubeconfig.makeApiClient(AppsV1Api)
  const batch = kubeconfig.makeApiClient(BatchV1Api)
  const core = kubeconfig.makeApiClient(CoreV1Api)
  return {
    listNamespaces: async () => (await core.listNamespace()).items,
    listDeployments: async namespace => (await apps.listNamespacedDeployment({ namespace })).items,
    listStatefulSets: async namespace => (await apps.listNamespacedStatefulSet({ namespace })).items,
    listDaemonSets: async namespace => (await apps.listNamespacedDaemonSet({ namespace })).items,
    listCronJobs: async namespace => (await batch.listNamespacedCronJob({ namespace })).items,
    listReplicaSets: async namespace => (await apps.listNamespacedReplicaSet({ namespace })).items,
    listJobs: async namespace => (await batch.listNamespacedJob({ namespace })).items,
    listPods: async namespace => (await core.listNamespacedPod({ namespace })).items,
  }
}

const ownerUid = resource => resource.metadata?.ownerReferences?.find(reference => reference.controller)?.uid
  ?? resource.metadata?.ownerReferences?.[0]?.uid

const desiredImages = (kind, resource) => {
  const template = kind === 'CronJob'
    ? resource.spec?.jobTemplate?.spec?.template
    : resource.spec?.template
  return uniqueSorted((template?.spec?.containers ?? []).map(container => container.image))
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
    ['available', status.availableReplicas ?? status.currentReplicas],
    ['updated', status.updatedReplicas],
  ].filter(([, value]) => Number.isFinite(value)))
}

const normalizeWorkload = (namespace, kind, resource, annotation) => {
  const labels = resource.metadata?.labels ?? {}
  return {
    uid: resource.metadata?.uid,
    namespace,
    kind,
    name: resource.metadata?.name,
    element: resource.metadata?.annotations?.[annotation]?.trim(),
    version: labels['app.kubernetes.io/version'] ?? null,
    chart: labels['helm.sh/chart'] ?? null,
    desiredImages: desiredImages(kind, resource),
    observedImageDigests: new Set(),
    replicas: replicaStatus(kind, resource),
  }
}

const listNamespaceResources = async (client, namespace, annotation) => {
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
    ...deployments.map(resource => normalizeWorkload(namespace, 'Deployment', resource, annotation)),
    ...statefulSets.map(resource => normalizeWorkload(namespace, 'StatefulSet', resource, annotation)),
    ...daemonSets.map(resource => normalizeWorkload(namespace, 'DaemonSet', resource, annotation)),
    ...cronJobs.map(resource => normalizeWorkload(namespace, 'CronJob', resource, annotation)),
  ]
  const mappedByUid = new Map(workloads.filter(workload => workload.element).map(workload => [workload.uid, workload]))
  const childOwners = new Map()
  for (const resource of [...replicaSets, ...jobs]) {
    const workload = mappedByUid.get(ownerUid(resource))
    if (workload && resource.metadata?.uid) childOwners.set(resource.metadata.uid, workload)
  }
  for (const pod of pods) {
    const uid = ownerUid(pod)
    const workload = mappedByUid.get(uid) ?? childOwners.get(uid)
    if (!workload) continue
    const statuses = [...(pod.status?.initContainerStatuses ?? []), ...(pod.status?.containerStatuses ?? [])]
    for (const status of statuses) {
      if (status.imageID) workload.observedImageDigests.add(status.imageID)
    }
  }
  return workloads
}

const compareWorkloads = (left, right) => [left.namespace, left.kind, left.name]
  .join('\0')
  .localeCompare([right.namespace, right.kind, right.name].join('\0'))

export const discoverTarget = async (target, clientFactory = apiClientFactory) => {
  try {
    const client = await clientFactory(target.context)
    const available = uniqueSorted((await client.listNamespaces()).map(namespace => namespace.metadata?.name))
    const excluded = new Set(target.excludedNamespaces)
    const included = target.includedNamespaces === '*'
      ? available
      : target.includedNamespaces.filter(namespace => available.includes(namespace))
    const namespaces = included.filter(namespace => !excluded.has(namespace))
    const workloads = (await Promise.all(namespaces.map(namespace =>
      listNamespaceResources(client, namespace, target.elementAnnotation),
    ))).flat().sort(compareWorkloads)

    return {
      context: target.context,
      deploymentFqn: target.deploymentFqn,
      namespaces,
      workloads: workloads.filter(workload => workload.element).map(({ uid, observedImageDigests, ...workload }) => ({
        ...workload,
        observedImageDigests: uniqueSorted([...observedImageDigests]),
      })),
      unmapped: workloads.filter(workload => !workload.element).map(workload => ({
        namespace: workload.namespace,
        kind: workload.kind,
        name: workload.name,
      })),
    }
  } catch (error) {
    throw new Error(`Unable to read Kubernetes context ${target.context}: ${error.message}`, { cause: error })
  }
}
