import { join } from 'node:path'
import { discoverTarget } from './discover.js'
import { mappingIssue } from './mappings.js'
import { renderOverlay } from './render.js'
import { readTargets } from './targets.js'
import { assertOutputOwned, replaceIfChanged, validateCandidate } from './validate.js'

const summaryOf = (snapshots, targetCount = snapshots.length) => ({
  targets: targetCount,
  mapped: snapshots.reduce((total, snapshot) => total + snapshot.workloads.length, 0),
  ignored: snapshots.reduce((total, snapshot) => total + snapshot.ignored.length, 0),
  unmapped: snapshots.reduce((total, snapshot) => total + snapshot.unmapped.length, 0),
})

const requireTargets = targets => {
  if (targets.length === 0) {
    throw new Error('No Kubernetes synchronization targets found in LikeC4 deployment metadata')
  }
}

export const defaultOutput = workspace => join(workspace, 'deployment.generated.c4')

const discoverSnapshots = async (targets, clientFactory, timeoutMs) => {
  const results = await Promise.allSettled(targets.map(target => discoverTarget(target, clientFactory, { timeoutMs })))
  const snapshots = []
  const failures = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      snapshots.push(result.value)
      return
    }
    const target = targets[index]
    failures.push({
      context: target.context,
      deploymentFqn: target.deploymentFqn,
      message: result.reason instanceof Error ? result.reason.message : String(result.reason),
    })
  })
  return { snapshots, failures }
}

const snapshotFailures = (model, snapshots) => snapshots.flatMap(snapshot => [
  ...snapshot.missingNamespaces.map(namespace => ({
    context: snapshot.context,
    deploymentFqn: snapshot.deploymentFqn,
    message: `Kubernetes context ${snapshot.context} is missing configured namespace ${namespace}`,
  })),
  ...snapshot.workloads.flatMap(workload => {
    const message = mappingIssue(model, workload)
    return message ? [{ context: snapshot.context, deploymentFqn: snapshot.deploymentFqn, message }] : []
  }),
])

const unmappedFailures = snapshots => snapshots.flatMap(snapshot => snapshot.unmapped.map(workload => ({
  context: snapshot.context,
  deploymentFqn: snapshot.deploymentFqn,
  message: `${workload.kind} ${workload.namespace}/${workload.name} is neither mapped nor ignored`,
})))

const inspectTargets = async ({ workspace, output, clientFactory, timeoutMs }) => {
  await assertOutputOwned({ workspace, output })
  const { model, targets } = await readTargets(workspace, { exclude: output })
  requireTargets(targets)
  const { snapshots, failures: accessFailures } = await discoverSnapshots(targets, clientFactory, timeoutMs)
  const failures = [...accessFailures, ...snapshotFailures(model, snapshots)]
  return { model, targets, snapshots, failures }
}

export const discover = async ({ workspace = 'model', output = defaultOutput(workspace), clientFactory, timeoutMs } = {}) => {
  const { targets, snapshots, failures } = await inspectTargets({ workspace, output, clientFactory, timeoutMs })
  return { workspace, snapshots, failures, summary: summaryOf(snapshots, targets.length) }
}

export const sync = async ({
  workspace = 'model',
  output = defaultOutput(workspace),
  clientFactory,
  timeoutMs,
  validateCandidateFn = validateCandidate,
  replaceIfChangedFn = replaceIfChanged,
} = {}) => {
  const { model, targets, snapshots, failures: inspectionFailures } = await inspectTargets({ workspace, output, clientFactory, timeoutMs })
  const failures = [...inspectionFailures, ...unmappedFailures(snapshots)]
  if (failures.length > 0) {
    throw new Error(['Unable to read all Kubernetes synchronization targets:', ...failures.map(failure => `- ${failure.message}`)].join('\n'))
  }
  const source = renderOverlay({ model, targets, snapshots })
  await validateCandidateFn({ workspace, output, source })
  const status = await replaceIfChangedFn({ output, source })
  return { workspace, output, status, snapshots, summary: summaryOf(snapshots) }
}
