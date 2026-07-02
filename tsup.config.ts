import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    window: 'src/window.ts',
    manager: 'src/manager.ts',
    snap: 'src/snap.ts'
  },

  format: ['esm', 'cjs'],

  dts: true,

  clean: true,

  sourcemap: false,

  target: 'es2019',

  treeshake: true,

  splitting: false,

  minify: false,

  platform: 'browser',

  bundle: true
})
