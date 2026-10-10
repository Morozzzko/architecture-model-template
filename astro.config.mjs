import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import { readdirSync, readFileSync } from 'node:fs'
import { LikeC4VitePlugin } from 'likec4/vite-plugin'

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
          items: readdirSync('docs/decisions')
            .filter((file) => /^\d+-.*\.md$/.test(file))
            .sort()
            .map((file) => ({
              label: readFileSync(`docs/decisions/${file}`, 'utf8').split('\n', 1)[0].replace(/^# |[`*]/g, ''),
              link: `/decisions/${file.replace(/\.md$/, '')}/`,
            })),
        },
      ],
    }),
    react(),
  ],
  vite: {
    plugins: [LikeC4VitePlugin({ workspace: 'model' })],
  },
})
