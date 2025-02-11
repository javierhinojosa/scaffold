// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightSidebarTopicsDropdown from 'starlight-sidebar-topics-dropdown'
import vercel from '@astrojs/vercel';
import starlightLinksValidator from 'starlight-links-validator'

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'SFH Documentation',
      social: {
        github: 'https://github.com/yourusername/sfh',
      },
      plugins: [
        starlightLinksValidator(),
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
                      { label: 'Supabase', link: '/dev/stack/supabase/' },
                      { label: 'Authentication', link: '/dev/stack/authentication/' },
                      { label: 'Tailwind + DaisyUI', link: '/dev/stack/styling/' },
                      { label: 'Testing', link: '/dev/stack/testing/' },
                      { label: 'Turborepo', link: '/dev/stack/turborepo/' },
                      { label: 'Deployment', link: '/dev/stack/deployment/' },
                    ],
                  },
                  {
                    label: 'Applications',
                    items: [
                      { label: 'Admin Dashboard', link: '/dev/apps/admin/' },
                      { label: 'Documentation Site', link: '/dev/apps/docs/' },
                      { label: 'Dify', link: '/dev/apps/dify/' },
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