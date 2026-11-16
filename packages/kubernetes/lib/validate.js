import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { LikeC4 } from 'likec4'
import { generatedHeader, isGeneratedSource } from './generated.js'

const sourceExtensions = new Set(['.c4', '.likec4'])
const configFilenames = new Set([
  '.likec4rc',
  '.likec4.config.json',
  'likec4.config.json',
  'likec4.config.js',
  'likec4.config.cjs',
  'likec4.config.mjs',
  'likec4.config.ts',
  'likec4.config.cts',
  'likec4.config.mts',
])

const sourceFiles = async directory => {
  const files = []
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await sourceFiles(path))
    if (entry.isFile() && (sourceExtensions.has(extname(entry.name)) || configFilenames.has(entry.name))) files.push(path)
  }
  return files
}

const pathIn = (workspace, file, label) => {
  const path = relative(workspace, file)
  if (path === '' || path.startsWith('..') || isAbsolute(path)) {
    throw new Error(`${label} must be a file inside the LikeC4 workspace`)
  }
  return path
}

const assertSupportedExtension = output => {
  if (!sourceExtensions.has(extname(output))) {
    throw new Error('Output must end in .c4 or .likec4 so LikeC4 validates it')
  }
}

const assertGeneratedCandidate = source => {
  if (!isGeneratedSource(source)) {
    throw new Error(`Generated candidate must start with ${generatedHeader}`)
  }
}

const readGeneratedOutput = async output => {
  try {
    const source = await readFile(output, 'utf8')
    if (!isGeneratedSource(source)) {
      throw new Error(`${output} exists and is not owned by @architecture-model/kubernetes`)
    }
    return source
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

export const assertOutputOwned = async ({ workspace, output }) => {
  const workspacePath = resolve(workspace)
  const outputPath = resolve(output)
  pathIn(workspacePath, outputPath, 'Output')
  assertSupportedExtension(outputPath)
  await readGeneratedOutput(outputPath)
}

export const inSourceMirror = async ({ workspace, exclude, replacement }, operation) => {
  const workspacePath = resolve(workspace)
  const excludedPath = exclude && resolve(exclude)
  const relativeReplacement = replacement
    ? pathIn(workspacePath, resolve(replacement.path), 'Replacement')
    : null
  const staging = await mkdtemp(join(tmpdir(), 'architecture-model-kubernetes-validation-'))

  try {
    const files = await sourceFiles(workspacePath)
    for (const file of files) {
      if (excludedPath && resolve(file) === excludedPath) continue
      const destination = join(staging, relative(workspacePath, file))
      await mkdir(dirname(destination), { recursive: true })
      await writeFile(destination, await readFile(file))
    }
    if (replacement) {
      const candidate = join(staging, relativeReplacement)
      await mkdir(dirname(candidate), { recursive: true })
      await writeFile(candidate, replacement.source)
    }
    const hasRootConfig = files.some(file => dirname(file) === workspacePath && configFilenames.has(basename(file)))
    if (!hasRootConfig) {
      await writeFile(join(staging, 'likec4.config.json'), JSON.stringify({ name: 'validation' }))
    }
    return await operation(staging)
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
}

export const validateCandidate = async ({ workspace, output, source }) => {
  await assertOutputOwned({ workspace, output })
  assertGeneratedCandidate(source)
  return inSourceMirror({
    workspace,
    exclude: output,
    replacement: { path: output, source },
  }, staging => LikeC4.fromWorkspace(staging, { throwIfInvalid: true, logger: false, printErrors: false }))
}

export const replaceIfChanged = async ({ output, source }) => {
  assertSupportedExtension(output)
  assertGeneratedCandidate(source)
  const existing = await readGeneratedOutput(output)
  if (existing === source) return 'unchanged'

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
