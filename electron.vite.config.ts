import { defineConfig } from 'electron-vite';
import { resolve } from 'path';

export default defineConfig({
  main: {
    build: {
      outDir: 'dist-electron/main',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/main/main.ts')
        }
      }
    }
  },
  preload: {
    build: {
      outDir: 'dist-electron/preload',
      rollupOptions: {
        input: {
          bridge: resolve(__dirname, 'src/preload/bridge.ts'),
          paneObserver: resolve(__dirname, 'src/preload/paneObserver.ts')
        },
        output: {
          format: 'cjs',
          entryFileNames: '[name].js'
        }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer')
  }
});