import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
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
      ],
    }),
    react(),
  ],
  vite: {
    plugins: [LikeC4VitePlugin({ workspace: 'model' })],
  },
})
