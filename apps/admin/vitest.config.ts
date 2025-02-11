/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { getViteConfig } from 'astro/config';

export default defineConfig(async () => {
  const viteConfig = await getViteConfig({
    root: process.cwd(),
    integrations: [],
  });

  return {
    ...viteConfig,
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      setupFiles: ['@sfh/testing/setup'],
      deps: {
        optimizer: {
          web: {
            include: [/@sfh\/testing/, /astro/]
          }
        }
      }
    },
  };
}); 