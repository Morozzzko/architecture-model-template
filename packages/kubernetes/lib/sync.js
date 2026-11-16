import { join } from 'node:path'
import { discoverTarget } from './discover.js'
import { renderOverlay } from './render.js'
import { readTargets } from './targets.js'
import { replaceIfChanged, validateCandidate } from './validate.js'

const summaryOf = snapshots => ({
  targets: snapshots.length,
  mapped: snapshots.reduce((total, snapshot) => total + snapshot.workloads.length, 0),
  unmapped: snapshots.reduce((total, snapshot) => total + snapshot.unmapped.length, 0),
})

const discoverSnapshots = (targets, clientFactory) => Promise.all(
  targets.map(target => discoverTarget(target, clientFactory)),
)

export const discover = async ({ workspace = 'model', clientFactory } = {}) => {
  const { targets } = await readTargets(workspace)
  const snapshots = await discoverSnapshots(targets, clientFactory)
  return { workspace, snapshots, summary: summaryOf(snapshots) }
}

export const sync = async ({
  workspace = 'model',
  output = join(workspace, 'deployment.generated.c4'),
  clientFactory,
  validateCandidateFn = validateCandidate,
  replaceIfChangedFn = replaceIfChanged,
} = {}) => {
  const { model, targets } = await readTargets(workspace, { exclude: output })
  const snapshots = await discoverSnapshots(targets, clientFactory)
  const source = renderOverlay({ model, targets, snapshots })
  await validateCandidateFn({ workspace, output, source })
  const status = await replaceIfChangedFn({ output, source })
  return { workspace, output, status, snapshots, summary: summaryOf(snapshots) }
}
