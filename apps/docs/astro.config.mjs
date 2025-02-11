// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'SFH Documentation',
      social: {
        github: 'https://github.com/yourusername/sfh',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/' },
            { label: 'Setup Guide', link: '/guides/getting-started/' },
          ],
        },
        {
          label: 'Applications',
          items: [
            { label: 'Admin Dashboard', link: '/guides/apps/admin/' },
            { label: 'Documentation Site', link: '/guides/apps/docs/' },
          ],
        },
        {
          label: 'Packages',
          items: [
            { label: 'Testing Utilities', link: '/guides/packages/testing/' },
          ],
        },
        {
          label: 'Development',
          items: [
            { label: 'Code Style', link: '/guides/development/code-style/' },
            { label: 'Testing', link: '/guides/development/testing/' },
            { label: 'Deployment', link: '/guides/development/deployment/' },
          ],
        },
      ],
    }),
  ],

  adapter: vercel(),
});