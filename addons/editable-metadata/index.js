import react from '@astrojs/react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { editor } from './editor.js'

const name = '@architecture-model/editable-metadata'
const virtual = 'virtual:editable-metadata/config'
const here = dirname(fileURLToPath(import.meta.url))
const editorFile = resolve(here, 'Editor.jsx')

// The editor only runs in the dev server, so the build gets an empty component instead of Radix and cmdk.
const withoutEditor = {
  name: 'editable-metadata-no-editor',
  enforce: 'pre',
  resolveId: (id, importer) => {
    const path = id.split('?')[0]
    const absolute = path.startsWith('.') && importer ? resolve(dirname(importer.split('?')[0]), path) : path
    return absolute === editorFile ? resolve(here, 'NoEditor.jsx') : undefined
  },
}

export default function editableMetadata({ model = 'model', fields = 'model/metadata.json' } = {}) {
  return {
    name,
    hooks: {
      'astro:config:setup': ({ config, command, updateConfig }) => {
        const root = fileURLToPath(config.root)
        const paths = { modelDir: resolve(root, model), fieldsFile: resolve(root, fields) }
        const hasReact = config.integrations.some((integration) => integration.name === '@astrojs/react')
        updateConfig({
          integrations: hasReact ? [] : [react()],
          vite: {
            ssr: { noExternal: [name] },
            plugins: [
              {
                name: 'editable-metadata-config',
                resolveId: (id) => (id === virtual ? `\0${virtual}` : undefined),
                load: (id) => (id === `\0${virtual}` ? `export default ${JSON.stringify(paths)}` : undefined),
              },
              editor(paths),
              command === 'build' && withoutEditor,
            ],
          },
        })
      },
    },
  }
}
