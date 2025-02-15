/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables
const envPath = resolve(__dirname, '../../.env');
config({ path: envPath });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [resolve(__dirname, '../testing/src/setup.ts')],
    environmentMatchGlobs: [['**/*.test.ts', 'node']],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    deps: {
      inline: ['@sfh/testing'],
    },
    env: {
      // Admin/service operations
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
      // Public client operations
      PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY,
    },
  },
});
