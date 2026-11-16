#!/usr/bin/env node

import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { discover, sync } from './lib/sync.js'

const count = (amount, singular) => `${amount} ${amount === 1 ? singular : `${singular}s`}`

export const run = async (args, {
  discoverFn = discover,
  syncFn = sync,
  writeOut = console.log,
  writeError = console.error,
} = {}) => {
  try {
    const command = args[0]
    if (!['discover', 'sync'].includes(command)) {
      throw new Error('Usage: architecture-model-kubernetes <discover|sync> [workspace] [--output path]')
    }
    const { values, positionals } = parseArgs({
      args: args.slice(1),
      options: { output: { type: 'string' } },
      allowPositionals: true,
      strict: true,
    })
    if (positionals.length > 1) throw new Error('Only one LikeC4 workspace path may be provided')
    if (command === 'discover' && values.output) throw new Error('--output is only available with sync')
    const workspace = positionals[0] ?? 'model'

    if (command === 'discover') {
      const report = await discoverFn({ workspace })
      writeOut(`Discovered ${count(report.summary.targets, 'target')}: ${report.summary.mapped} mapped, ${report.summary.unmapped} unmapped`)
      for (const snapshot of report.snapshots) {
        for (const workload of snapshot.unmapped) {
          writeOut(`Unmapped ${snapshot.context} ${workload.kind} ${workload.namespace}/${workload.name}`)
        }
      }
      for (const failure of report.failures ?? []) writeError(failure.message)
      return (report.failures?.length ?? 0) > 0 ? 1 : 0
    }

    const output = values.output ?? joinWorkspace(workspace, 'deployment.generated.c4')
    const report = await syncFn({ workspace, output })
    const verb = report.status === 'changed' ? 'Updated deployment snapshot' : 'Deployment snapshot unchanged'
    writeOut(`${verb}: ${output} (${count(report.summary.targets, 'target')}, ${report.summary.mapped} mapped, ${report.summary.unmapped} unmapped)`)
    return 0
  } catch (error) {
    writeError(error.message)
    return 1
  }
}

const joinWorkspace = (workspace, file) => workspace.endsWith('/') ? `${workspace}${file}` : `${workspace}/${file}`

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
if (isMain) process.exitCode = await run(process.argv.slice(2))
