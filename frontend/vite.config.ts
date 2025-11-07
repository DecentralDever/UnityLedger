import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Keep this minimal first; we’ll add extras after it compiles
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // This makes esbuild treat .js as JSX during the pre-bundle/scan step
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
})
