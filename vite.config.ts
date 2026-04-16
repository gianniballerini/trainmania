import { resolve } from 'node:path'
import { renderFile } from 'pug'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'render-index-pug',
      transformIndexHtml: {
        order: 'pre',
        handler() {
          return renderFile(resolve(__dirname, 'index.pug'))
        },
      },
    },
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
