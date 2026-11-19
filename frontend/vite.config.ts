import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    include: '**/*.{jsx,tsx}',
    jsxRuntime: 'automatic',
  })],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-dom/client'],
    force: true,
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.ts': 'tsx',
      },
    },
  },
})