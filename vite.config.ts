import { sentryVitePlugin } from '@sentry/vite-plugin';
import { copyFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { defineConfig, type PluginOption } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import react from '@vitejs/plugin-react';

function pyodide(): PluginOption {
  const assetsDir = 'dist/assets';
  const files = ['pyodide-lock.json', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip'];

  return {
    name: 'vite-plugin-pyodide',
    async generateBundle() {
      await mkdir(assetsDir, { recursive: true });
      for (const file of files) {
        await copyFile(join('node_modules/pyodide', file), join(assetsDir, file));
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': join(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
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
    // @link https://vite-pwa-org.netlify.app/guide/service-worker-without-pwa-capabilities.html
    VitePWA({
      srcDir: 'src',
      filename: 'service-worker.ts',
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: true,
      },
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'dist/index.html', // source file in the output directory
          dest: '', // destination folder (root of the `dist` folder)
          rename: '404.html', // rename the copied file
        },
      ],
    }),
    sentryVitePlugin({
      org: 'kodeon-dev',
      project: 'kodeon-test',
      sourcemaps: {
        filesToDeleteAfterUpload: '**/*.js.map',
      },
    }),
  ],
  worker: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
