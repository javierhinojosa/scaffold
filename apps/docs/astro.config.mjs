// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightSidebarTopicsDropdown from 'starlight-sidebar-topics-dropdown'
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'SFH Documentation',
      social: {
        github: 'https://github.com/yourusername/sfh',
      },
      plugins: [
        starlightSidebarTopicsDropdown([
          {
            label: 'Development',
            link: '/dev/',
            icon: 'open-book',
            items: [
                {
                    label: 'Getting Started',
                    items: [
                      { label: 'Introduction', link: '/' },
                      { label: 'Setup Guide', link: '/dev/getting-started/' },
                    ],
                  },
                  {
                    label: 'Stack',
                    items: [
                      { label: 'Astro', link: '/dev/stack/astro/' },
                      { label: 'Svelte', link: '/dev/stack/svelte/' },
                      { label: 'Tailwind + DaisyUI', link: '/dev/stack/styling/' },
                      { label: 'Testing', link: '/dev/stack/testing/' },
                      { label: 'Deployment', link: '/dev/stack/deployment/' },
                    ],
                  },
                  {
                    label: 'Applications',
                    items: [
                      { label: 'Admin Dashboard', link: '/dev/apps/admin/' },
                      { label: 'Documentation Site', link: '/dev/apps/docs/' },
                    ],
                  },
                  {
                    label: 'Packages',
                    items: [
                      { label: 'Testing Utilities', link: '/dev/packages/testing/' },
                    ],
                  },
                  {
                    label: 'Development',
                    items: [
                      { label: 'Code Style', link: '/dev/development/code-style/' },
                      { label: 'Testing', link: '/dev/development/testing/' },
                      { label: 'Deployment', link: '/dev/development/deployment/' },
                    ],
                  },
            ],
          },
          {
            label: 'Reference',
            link: '/reference/',
            icon: 'information',
            items: ['reference/example'],
          },
        ]),
      ],
     
    }),
  ],

  adapter: vercel(),
});