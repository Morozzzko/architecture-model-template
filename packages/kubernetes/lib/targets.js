import { LikeC4 } from 'likec4'
import { inSourceMirror } from './validate.js'

const targetKeys = [
  'kubernetesContext',
  'kubernetesNamespaces',
  'kubernetesExcludeNamespaces',
  'kubernetesElementAnnotation',
  'kubernetesIgnoreAnnotation',
]

const values = value => {
  const list = Array.isArray(value) ? value : value === undefined ? [] : [value]
  return [...new Set(list.map(item => item.trim()).filter(Boolean))].sort()
}

const hasAnyTargetKey = node => targetKeys.some(key => Object.hasOwn(node.metadata, key))

const one = (node, key, errors) => {
  const normalized = values(node.getMetadata(key))
  if (normalized.length !== 1) errors.push(key)
  return normalized[0]
}

const optionalOne = (node, key, errors) => {
  const normalized = values(node.getMetadata(key))
  if (normalized.length > 1) errors.push(`${key} must have at most one value`)
  return normalized[0] ?? null
}

const namespaceScope = (node, errors) => {
  const included = values(node.getMetadata('kubernetesNamespaces'))
  const excluded = values(node.getMetadata('kubernetesExcludeNamespaces'))
  if (included.length === 0) errors.push('kubernetesNamespaces')
  if (included.includes('*')) {
    if (included.length > 1) errors.push('kubernetesNamespaces must be either a list or \'*\'')
    return { includedNamespaces: '*', excludedNamespaces: excluded }
  }
  const excludedSet = new Set(excluded)
  const selected = included.filter(namespace => !excludedSet.has(namespace))
  if (selected.length === 0) errors.push('kubernetesNamespaces is empty after exclusions')
  return {
    includedNamespaces: selected,
    excludedNamespaces: excluded,
  }
}

const authoredNamespaces = target => {
  const mappings = {}
  for (const descendant of target.descendants()) {
    if (!descendant.isDeploymentNode()) continue
    const namespace = values(descendant.getMetadata('kubernetesNamespace'))
    if (namespace.length === 0) continue
    if (descendant.kind !== 'namespace') {
      throw new Error(`${descendant.id} has kubernetesNamespace but is not a namespace deployment node`)
    }
    if (namespace.length !== 1) {
      throw new Error(`${descendant.id} must have exactly one kubernetesNamespace`)
    }
    if (Object.hasOwn(mappings, namespace[0])) {
      throw new Error(`Kubernetes namespace ${namespace[0]} is mapped by both ${mappings[namespace[0]]} and ${descendant.id}`)
    }
    mappings[namespace[0]] = descendant.id
  }
  return mappings
}

export const readTargets = async (workspace, { exclude } = {}) => {
  if (exclude) {
    return inSourceMirror({ workspace, exclude }, mirrored => readTargets(mirrored))
  }
  const likec4 = await LikeC4.fromWorkspace(workspace, { throwIfInvalid: true, logger: false, printErrors: false })
  const model = await likec4.computedModel()
  const nodes = [...model.deployment.nodes()]
  const candidates = nodes.filter(hasAnyTargetKey)

  if (candidates.length > 0 && !Object.hasOwn(model.specification.deployments, 'namespace')) {
    throw new Error('Kubernetes synchronization requires `deploymentNode namespace` in the specification')
  }

  const targets = candidates.map(node => {
    if (node.kind !== 'cluster') {
      throw new Error(`${node.id} has Kubernetes target metadata but is not a cluster deployment node`)
    }
    const errors = []
    const context = one(node, 'kubernetesContext', errors)
    const elementAnnotation = one(node, 'kubernetesElementAnnotation', errors)
    const ignoreAnnotation = optionalOne(node, 'kubernetesIgnoreAnnotation', errors)
    if (ignoreAnnotation && ignoreAnnotation === elementAnnotation) {
      errors.push('kubernetesIgnoreAnnotation must differ from kubernetesElementAnnotation')
    }
    const scope = namespaceScope(node, errors)
    if (errors.length > 0) {
      throw new Error(`Invalid Kubernetes target ${node.id}: ${errors.join(', ')}`)
    }
    return {
      deploymentFqn: node.id,
      context,
      ...scope,
      elementAnnotation,
      ...(ignoreAnnotation ? { ignoreAnnotation } : {}),
      authoredNamespaces: authoredNamespaces(node),
    }
  }).sort((left, right) => left.deploymentFqn < right.deploymentFqn ? -1 : left.deploymentFqn > right.deploymentFqn ? 1 : 0)

  const contexts = new Map()
  for (const target of targets) {
    const existing = contexts.get(target.context)
    if (existing) {
      throw new Error(`Kubernetes context ${target.context} is used by both ${existing} and ${target.deploymentFqn}`)
    }
    contexts.set(target.context, target.deploymentFqn)
  }

  return { model, targets }
}
