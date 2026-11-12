/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site at /<repo-name>/. Override with BASE_PATH if the repo is renamed.
const base = process.env.BASE_PATH ?? '/contest-arbiter-hacks-v1/';

export default defineConfig({
  base,
  plugins: [react()],
  build: { target: 'es2020', sourcemap: false },
  test: { environment: 'node', include: ['tests/**/*.test.{ts,tsx}'] },
});
