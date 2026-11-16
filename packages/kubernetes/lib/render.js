import { createHash } from 'node:crypto'
import { generatedHeader } from './generated.js'
import { mappingIssue } from './mappings.js'

const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0
const sorted = values => [...new Set(values)].sort(compare)

const escape = value => String(value)
  .replaceAll('\\', '\\\\')
  .replaceAll("'", "\\'")
  .replaceAll('\r', '\\r')
  .replaceAll('\n', '\\n')

const quote = value => `'${escape(value)}'`

const identifier = value => {
  const sanitized = value.replace(/[^A-Za-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'generated'
  return /^\d/.test(sanitized) ? `_${sanitized}` : sanitized
}

const stableHash = value => createHash('sha256').update(value).digest('hex').slice(0, 8)

const assignIds = (items, name, identity) => {
  const groups = new Map()
  for (const item of items) {
    const base = identifier(name(item))
    groups.set(base, [...(groups.get(base) ?? []), item])
  }
  return new Map(items.map(item => {
    const base = identifier(name(item))
    const id = groups.get(base).length === 1 ? base : `${base}_${stableHash(identity(item))}`
    return [item, id]
  }))
}

const scalar = (lines, indent, key, value) => {
  if (value === null || value === undefined || value === '') return
  lines.push(`${indent}${key} ${quote(value)}`)
}

const list = (lines, indent, key, values) => {
  const normalized = sorted(values)
  if (normalized.length === 0) return
  lines.push(`${indent}${key} [`)
  normalized.forEach((value, index) => lines.push(`${indent}  ${quote(value)}${index === normalized.length - 1 ? '' : ','}`))
  lines.push(`${indent}]`)
}

const workloadLines = (workload, id, context, indent) => {
  const lines = [
    `${indent}${id} = instanceOf ${workload.element} {`,
    `${indent}  title ${quote(`${workload.name} (${workload.kind})`)}`,
    `${indent}  metadata {`,
  ]
  const metadataIndent = `${indent}    `
  scalar(lines, metadataIndent, 'kubernetesContext', context)
  scalar(lines, metadataIndent, 'kubernetesNamespace', workload.namespace)
  scalar(lines, metadataIndent, 'kubernetesKind', workload.kind)
  scalar(lines, metadataIndent, 'kubernetesName', workload.name)
  scalar(lines, metadataIndent, 'version', workload.version)
  scalar(lines, metadataIndent, 'helmChart', workload.chart)
  list(lines, metadataIndent, 'desiredImages', workload.desiredImages)
  list(lines, metadataIndent, 'observedImageIds', workload.observedImageIds)
  scalar(lines, metadataIndent, 'desiredReplicas', workload.replicas.desired)
  scalar(lines, metadataIndent, 'readyReplicas', workload.replicas.ready)
  scalar(lines, metadataIndent, 'availableReplicas', workload.replicas.available)
  scalar(lines, metadataIndent, 'updatedReplicas', workload.replicas.updated)
  lines.push(`${indent}  }`, `${indent}}`)
  return lines
}

const workloadsIn = (snapshot, namespace) => snapshot.workloads
  .filter(workload => workload.namespace === namespace)
  .sort((left, right) => compare([left.kind, left.name].join('\0'), [right.kind, right.name].join('\0')))

const workloadIds = workloads => assignIds(workloads, workload => workload.name, workload => `${workload.kind}:${workload.name}`)

const assertElementsExist = (model, workloads) => {
  for (const workload of workloads) {
    const issue = mappingIssue(model, workload)
    if (issue) throw new Error(issue)
  }
}

const assertNoAuthoredCollision = (model, namespaceFqn, workloads, ids) => {
  const node = model.deployment.node(namespaceFqn)
  const authored = new Set([...node.children()].map(child => child.name))
  for (const workload of workloads) {
    const base = identifier(workload.name)
    const id = ids.get(workload)
    if (authored.has(base) || authored.has(id)) {
      throw new Error(`Generated workload ${workload.namespace}/${workload.name} (${base}) collides with an authored child of ${namespaceFqn}`)
    }
  }
}

const renderAuthoredNamespace = (model, target, snapshot, namespace) => {
  const fqn = target.authoredNamespaces[namespace]
  const workloads = workloadsIn(snapshot, namespace)
  if (workloads.length === 0) return null
  const ids = workloadIds(workloads)
  assertNoAuthoredCollision(model, fqn, workloads, ids)
  return [
    `  extend ${fqn} {`,
    ...workloads.flatMap((workload, index) => [
      ...(index === 0 ? [] : ['']),
      ...workloadLines(workload, ids.get(workload), snapshot.context, '    '),
    ]),
    '  }',
  ]
}

const renderGeneratedNamespaces = (model, target, snapshot, namespaces) => {
  if (namespaces.length === 0) return null
  const ids = assignIds(namespaces, namespace => namespace, namespace => namespace)
  const targetNode = model.deployment.node(target.deploymentFqn)
  const authoredChildren = new Set([...targetNode.children()].map(child => child.name))
  for (const namespace of namespaces) {
    const base = identifier(namespace)
    if (authoredChildren.has(base) || authoredChildren.has(ids.get(namespace))) {
      throw new Error(`Generated namespace ${namespace} (${base}) collides with an authored child of ${target.deploymentFqn}`)
    }
  }
  const lines = [`  extend ${target.deploymentFqn} {`]
  namespaces.forEach((namespace, namespaceIndex) => {
    if (namespaceIndex > 0) lines.push('')
    lines.push(
      `    namespace ${ids.get(namespace)} {`,
      `      title ${quote(namespace)}`,
      '      metadata {',
      `        kubernetesNamespace ${quote(namespace)}`,
      '      }',
    )
    const workloads = workloadsIn(snapshot, namespace)
    const idsByWorkload = workloadIds(workloads)
    workloads.forEach((workload, workloadIndex) => {
      if (workloadIndex > 0) lines.push('')
      lines.push(...workloadLines(workload, idsByWorkload.get(workload), snapshot.context, '      '))
    })
    lines.push('    }')
  })
  lines.push('  }')
  return lines
}

export const renderOverlay = ({ model, targets, snapshots }) => {
  const targetsByFqn = new Map(targets.map(target => [target.deploymentFqn, target]))
  const snapshotsByFqn = new Map(snapshots.map(snapshot => [snapshot.deploymentFqn, snapshot]))
  const blocks = []

  for (const fqn of sorted([...targetsByFqn.keys()])) {
    const target = targetsByFqn.get(fqn)
    const snapshot = snapshotsByFqn.get(fqn)
    if (!snapshot) throw new Error(`Missing Kubernetes snapshot for ${fqn}`)
    assertElementsExist(model, snapshot.workloads)
    const namespaces = sorted(snapshot.workloads.map(workload => workload.namespace))
    for (const namespace of namespaces.filter(name => Object.hasOwn(target.authoredNamespaces, name))) {
      const block = renderAuthoredNamespace(model, target, snapshot, namespace)
      if (block) blocks.push(block)
    }
    const generated = namespaces.filter(namespace => !Object.hasOwn(target.authoredNamespaces, namespace))
    const block = renderGeneratedNamespaces(model, target, snapshot, generated)
    if (block) blocks.push(block)
  }

  const lines = [generatedHeader, '', 'deployment {']
  blocks.forEach((block, index) => {
    if (index > 0) lines.push('')
    lines.push(...block)
  })
  lines.push('}', '')
  return lines.join('\n')
}
