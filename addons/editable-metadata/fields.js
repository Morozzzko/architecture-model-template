import { existsSync, readFileSync } from 'node:fs'
import config from 'virtual:editable-metadata/config'

export const peopleFields = {
  integratedBy: 'Integrated by',
  experts: 'Experts',
  contributors: 'Contributors',
  administrators: 'Administrators',
}

const defaults = {
  ...Object.fromEntries(Object.keys(peopleFields).map((key) => [key, { type: 'people' }])),
  peopleConfirmed: { type: 'date' },
}

const read = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback)

export const fieldOf = (name) => read(config.fieldsFile, {})[name] ?? defaults[name] ?? { type: 'text' }

export const people = () => read(config.peopleFile, [])
