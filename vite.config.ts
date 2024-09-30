import { copyFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'

function pyodide(): PluginOption {
  const assetsDir = 'dist/assets';
  const files = [
    'pyodide-lock.json',
    'pyodide.asm.js',
    'pyodide.asm.wasm',
    'python_stdlib.zip',
  ];

  return {
    name: 'vite-plugin-pyodide',
    async generateBundle() {
      await mkdir(assetsDir, { recursive: true });
      for (const file of files) {
        await copyFile(
          join('node_modules/pyodide', file),
          join(assetsDir, file),
        );
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  optimizeDeps: {
    exclude: ['pyodide'],
  },
  plugins: [
    react(),
    pyodide(),
  ],
  worker: {
    rollupOptions: {
      output:{
        inlineDynamicImports: true
      },
    },
  },
});
