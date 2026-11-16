import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { LikeC4 } from 'likec4'

const sourceExtensions = new Set(['.c4', '.likec4'])

const sourceFiles = async directory => {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await sourceFiles(path))
    if (entry.isFile() && sourceExtensions.has(extname(entry.name))) files.push(path)
  }
  return files
}

const outputPathIn = (workspace, output) => {
  const path = relative(workspace, output)
  if (path === '' || path.startsWith('..') || isAbsolute(path)) {
    throw new Error('Generated output must be a file inside the LikeC4 workspace')
  }
  return path
}

export const validateCandidate = async ({ workspace, output, source }) => {
  const workspacePath = resolve(workspace)
  const outputPath = resolve(output)
  const relativeOutput = outputPathIn(workspacePath, outputPath)
  const staging = await mkdtemp(join(tmpdir(), 'architecture-model-kubernetes-validation-'))

  try {
    for (const file of await sourceFiles(workspacePath)) {
      if (resolve(file) === outputPath) continue
      const destination = join(staging, relative(workspacePath, file))
      await mkdir(dirname(destination), { recursive: true })
      await writeFile(destination, await readFile(file))
    }
    const candidate = join(staging, relativeOutput)
    await mkdir(dirname(candidate), { recursive: true })
    await writeFile(candidate, source)
    await writeFile(join(staging, 'likec4.config.json'), JSON.stringify({ name: 'validation' }))
    await LikeC4.fromWorkspace(staging, { throwIfInvalid: true, logger: false, printErrors: false })
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
}

export const replaceIfChanged = async ({ output, source }) => {
  try {
    if (await readFile(output, 'utf8') === source) return 'unchanged'
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }

  await mkdir(dirname(output), { recursive: true })
  const temporary = join(dirname(output), `.${randomUUID()}.tmp`)
  try {
    await writeFile(temporary, source, { flag: 'wx' })
    await rename(temporary, output)
  } finally {
    await rm(temporary, { force: true })
  }
  return 'changed'
}
