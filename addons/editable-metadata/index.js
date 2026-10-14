import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { editor } from './editor.js'

const name = '@architecture-model/editable-metadata'
const virtual = 'virtual:editable-metadata/config'

export default function editableMetadata({ model = 'model', fields = 'model/metadata.json' } = {}) {
  return {
    name,
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        const root = fileURLToPath(config.root)
        const paths = { modelDir: resolve(root, model), fieldsFile: resolve(root, fields) }
        updateConfig({
          vite: {
            ssr: { noExternal: [name] },
            plugins: [
              {
                name: 'editable-metadata-config',
                resolveId: (id) => (id === virtual ? `\0${virtual}` : undefined),
                load: (id) => (id === `\0${virtual}` ? `export default ${JSON.stringify(paths)}` : undefined),
              },
              editor(paths),
            ],
          },
        })
      },
    },
  }
}
