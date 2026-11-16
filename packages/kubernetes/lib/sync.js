import { join } from 'node:path'
import { discoverTarget } from './discover.js'
import { renderOverlay } from './render.js'
import { readTargets } from './targets.js'
import { assertOutputOwned, replaceIfChanged, validateCandidate } from './validate.js'

const summaryOf = (snapshots, failures = []) => ({
  targets: snapshots.length + failures.length,
  mapped: snapshots.reduce((total, snapshot) => total + snapshot.workloads.length, 0),
  unmapped: snapshots.reduce((total, snapshot) => total + snapshot.unmapped.length, 0),
})

const requireTargets = targets => {
  if (targets.length === 0) {
    throw new Error('No Kubernetes synchronization targets found in LikeC4 deployment metadata')
  }
}

const discoverSnapshots = async (targets, clientFactory) => {
  const results = await Promise.allSettled(targets.map(target => discoverTarget(target, clientFactory)))
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

export const discover = async ({ workspace = 'model', clientFactory } = {}) => {
  const { targets } = await readTargets(workspace)
  requireTargets(targets)
  const { snapshots, failures } = await discoverSnapshots(targets, clientFactory)
  return { workspace, snapshots, failures, summary: summaryOf(snapshots, failures) }
}

export const sync = async ({
  workspace = 'model',
  output = join(workspace, 'deployment.generated.c4'),
  clientFactory,
  validateCandidateFn = validateCandidate,
  replaceIfChangedFn = replaceIfChanged,
} = {}) => {
  await assertOutputOwned({ workspace, output })
  const { model, targets } = await readTargets(workspace, { exclude: output })
  requireTargets(targets)
  const { snapshots, failures } = await discoverSnapshots(targets, clientFactory)
  if (failures.length > 0) {
    throw new Error(['Unable to read all Kubernetes synchronization targets:', ...failures.map(failure => `- ${failure.message}`)].join('\n'))
  }
  const source = renderOverlay({ model, targets, snapshots })
  await validateCandidateFn({ workspace, output, source })
  const status = await replaceIfChangedFn({ output, source })
  return { workspace, output, status, snapshots, summary: summaryOf(snapshots) }
}
