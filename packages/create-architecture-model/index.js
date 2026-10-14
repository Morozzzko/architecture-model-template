#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { parseArgs } from 'node:util'
import { copyTemplate } from './template.js'

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  allowNegative: true,
  options: {
    yes: { type: 'boolean', short: 'y' },
    install: { type: 'boolean', default: true },
    git: { type: 'boolean', default: true },
    help: { type: 'boolean', short: 'h' },
  },
})

if (flags.help) {
  console.log(`Usage: npm create architecture-model [directory] [-- options]

Creates an architecture repository in the directory, installs its dependencies
and initialises a git repository.

  -y, --yes       don't ask; name the project after the directory
  --no-install    don't install dependencies
  --no-git        don't initialise a git repository`)
  process.exit(0)
}

const fail = (message) => {
  console.error(`\n✗ ${message}`)
  process.exit(1)
}

// Read line by line instead of using readline's question(), which drops answers piped in ahead of the prompt.
const lines = createInterface({ input: process.stdin })[Symbol.asyncIterator]()

async function ask(question, fallback) {
  if (flags.yes && fallback !== undefined) return fallback
  process.stdout.write(fallback ? `${question} [${fallback}]: ` : `${question}: `)
  const { value = '' } = await lines.next()
  return value.trim() || fallback
}

function replace(file, from, to) {
  const text = readFileSync(file, 'utf8')
  if (!text.includes(from)) fail(`${from} not found in ${file}. The template and the generator are out of step.`)
  writeFileSync(file, text.replaceAll(from, () => to))
}

const quote = (text) => `'${text.replace(/[\\']/g, '\\$&')}'`

const directory = resolve(positionals[0] ?? ((await ask('Directory', flags.yes ? undefined : 'my-architecture')) || '.'))
if (existsSync(directory) && readdirSync(directory).length) fail(`${directory} exists and is not empty.`)

const name = await ask('Name', basename(directory))
const description = await ask('Description (optional)', '')

copyTemplate(directory)
const model = join(directory, 'model/model.c4')
const config = join(directory, 'astro.config.mjs')
replace(model, `'Software System'`, quote(name))
replace(config, `title: 'Architecture'`, `title: ${quote(name)}`)
if (description) {
  replace(model, `'A software system.'`, quote(description))
  replace(config, `title: ${quote(name)},`, `title: ${quote(name)},\n      description: ${quote(description)},`)
}
console.log(`\n✓ Created ${directory}`)

const run = (command, args, stdio = 'inherit') => spawnSync(command, args, { cwd: directory, stdio }).status === 0
const insideRepository = run('git', ['rev-parse', '--is-inside-work-tree'], 'ignore')
if (flags.git && !insideRepository && !run('git', ['init', '--quiet'])) {
  fail(`git init failed. The files are in place; run it yourself in ${directory}.`)
}
if (flags.install && !run('npm', ['install'])) {
  fail(`npm install failed. The files are in place; run it yourself in ${directory}.`)
}

console.log(`
Next steps:
  cd ${directory}${flags.install ? '' : '\n  npm install'}
  npm run dev        the site, at http://localhost:4321
  npm run validate   check the model
`)
process.exit(0)
