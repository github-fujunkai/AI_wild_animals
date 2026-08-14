import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    test: {
      environment: 'jsdom',
    },
    base: env.VITE_BASE_PATH || '/',
    build: {
      sourcemap: 'hidden',
    },
    plugins: [
      react({
        babel: {
          plugins: [
            'react-dev-locator',
          ],
        },
      }),
      tsconfigPaths()
    ],
    server: {
      port: 5177,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8082',
          changeOrigin: true,
        },
        '/static': {
          target: 'http://127.0.0.1:8082',
          changeOrigin: true,
        },
      },
    },
  }
})
