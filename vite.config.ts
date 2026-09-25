import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Relative paths for GitHub Pages subpath support (congkhuong.github.io/kayfit/app/)
  build: {
    outDir: 'docs', // Build directly into /docs folder if deploying from branch main /docs
  },
});
