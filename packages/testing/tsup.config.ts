import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    auth: 'src/auth.ts',
    setup: 'src/setup.ts',
  },
  format: ['esm'],
  dts: {
    compilerOptions: {
      composite: false,
      incremental: false,
      tsBuildInfoFile: undefined,
    },
  },
  splitting: false,
  clean: true,
  sourcemap: true,
  treeshake: true,
  bundle: true,
  external: ['@sfh/backend', '@sfh/backend/test-utils'],
});
