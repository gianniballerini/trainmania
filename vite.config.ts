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
        handler(html, ctx) {
          if (!ctx.filename.endsWith('editor.html')) {
            return renderFile(resolve(__dirname, 'index.pug'))
          }
          return html
        },
      },
      configureServer(server) {
        // Watch all .pug files
        server.watcher.add(resolve(__dirname, 'src/views/*.pug'))
        server.watcher.add(resolve(__dirname, 'index.pug'))
      },
      handleHotUpdate({ file, server }) {
        if (file.endsWith('.pug')) {
          server.ws.send({ type: 'full-reload' })
          return []
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main:   resolve(__dirname, 'index.html'),
        editor: resolve(__dirname, 'editor.html'),
      },
    },
  },
})
