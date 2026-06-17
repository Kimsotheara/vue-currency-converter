import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // APIFOOTBALL_KEY lives in .env.local and is injected by the dev proxy below,
  // so the key stays server-side and never ships in the client bundle.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      tailwindcss(),
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      proxy: {
        // Browser -> /api/football/...  ->  https://v3.football.api-sports.io/...
        '/api/football': {
          target: 'https://v3.football.api-sports.io',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/football/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.APIFOOTBALL_KEY) proxyReq.setHeader('x-apisports-key', env.APIFOOTBALL_KEY)
            })
          },
        },
      },
    },
  }
})
