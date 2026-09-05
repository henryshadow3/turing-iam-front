import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Config EXCLUSIVA para el harness de verificación visual de W10
// (preview.html). Idéntica a vite.config.js salvo por:
//   1. root apunta a preview.html en vez de index.html.
//   2. alias `@/api/client` -> `@/dev/mockClient.js`, para que
//      UserDetailPanel (código real, sin duplicar) reciba datos mockeados
//      en vez de pegarle al turing-api real.
// NUNCA se usa para el build de producción -- ese sigue siendo
// vite.config.js + index.html, sin tocar.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5175,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@/api/client': fileURLToPath(new URL('./src/dev/mockClient.js', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
