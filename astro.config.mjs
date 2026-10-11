import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LikeC4VitePlugin } from 'likec4/vite-plugin'
import { decisions, decisionsDir } from './src/lib/decisions.mjs'

// The sidebar is built when this file loads, so a changed ADR has to look like a config change.
const reloadSidebarOnDecisionChange = {
  name: 'reload-sidebar-on-decision-change',
  configureServer(server) {
    const config = fileURLToPath(import.meta.url)
    const reload = (file) => {
      if (file.startsWith(resolve(decisionsDir))) server.watcher.emit('change', config)
    }
    server.watcher.on('add', reload).on('unlink', reload).on('change', reload)
  },
}

export default defineConfig({
  site: process.env.SITE_URL,
  base: process.env.BASE_PATH,
  integrations: [
    starlight({
      title: 'Architecture',
      sidebar: [
        { label: 'Overview', link: '/' },
        { label: 'arc42', link: '/arc42/' },
        {
          label: 'Decisions',
          items: decisions().map(({ title, slug }) => ({ label: title, link: `/decisions/${slug}/` })),
        },
      ],
    }),
    react(),
  ],
  vite: {
    plugins: [LikeC4VitePlugin({ workspace: 'model' }), reloadSidebarOnDecisionChange],
  },
})
