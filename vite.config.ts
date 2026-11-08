import { defineConfig } from 'vite';

// base relativa: el mismo dist/ sirve en Vercel y en GitHub Pages (subcarpeta).
export default defineConfig({
  base: './',
  test: { include: ['tests/**/*.test.ts'] },
} as any);
