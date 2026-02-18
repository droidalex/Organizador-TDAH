import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { sveltePreprocess } from 'svelte-preprocess'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
    })
  ],
  resolve: {
    alias: {
      '$lib': path.resolve('./src/lib'),
      '$': path.resolve('./src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 34115,
    strictPort: true
  }
})
