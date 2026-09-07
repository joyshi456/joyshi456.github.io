import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // GitHub Pages base path for user site
  build: {
    rollupOptions: {
      input: {
        // Win98 portfolio (root) + the standalone corkboard and quiz pages
        main: 'index.html',
        events: 'events/index.html',
        quiz: 'quiz/index.html',
      },
    },
  },
})
