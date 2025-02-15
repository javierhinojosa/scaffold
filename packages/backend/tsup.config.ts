import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'test-utils': 'src/test-utils.ts',
    auth: 'src/auth.ts',
    types: 'src/types.ts',
  },
  format: ['esm', 'cjs'],
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
});
