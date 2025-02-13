// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightSidebarTopicsDropdown from 'starlight-sidebar-topics-dropdown'
import vercel from '@astrojs/vercel';
import starlightLinksValidator from 'starlight-links-validator'
import starlightGiscus from 'starlight-giscus'
import rehypeMermaid from "rehype-mermaid";

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false
  },
  server: {
    port: 4321
  },

  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.GITHUB_REPO': JSON.stringify(process.env.GITHUB_REPO),
      'import.meta.env.GITHUB_BRANCH': JSON.stringify(process.env.GITHUB_BRANCH),
      'import.meta.env.GITHUB_TOKEN': JSON.stringify(process.env.GITHUB_TOKEN),
      'import.meta.env.PUBLIC_ADMIN_URL': JSON.stringify(process.env.PUBLIC_ADMIN_URL),
      'import.meta.env.PUBLIC_WEBSITE_URL': JSON.stringify(process.env.PUBLIC_WEBSITE_URL),
    },
  },

  integrations: [
   
    starlight({
      title: 'Scaffold Documentation',
      customCss: [
        './src/tailwind.css',
      ],
      components: {
        TwoColumnContent: './src/components/TwoColumnContent.astro',
        MarkdownContent: './src/components/MarkdownContent.astro',
        Header: './src/components/Header.astro',
      },
      social: {
        github: 'https://github.com/javierhinojosa/scaffold',
      },
      logo: {
        src: './src/assets/logo.png',
        alt: 'Scaffold Logo',
      },
      plugins: [starlightGiscus({
        repo: 'javierhinojosa/scaffold',
        repoId: 'R_kgDON4sFNQ',
        category: 'Announcements',
        categoryId: 'DIC_kwDON4sFNc4Cm6nO'
    }),
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
                      {
                        label: 'Frontend',
                        items: [
                          { label: 'Astro', link: '/dev/stack/astro/' },
                          { label: 'Svelte', link: '/dev/stack/svelte/' },
                          { label: 'Tailwind + DaisyUI', link: '/dev/stack/styling/' },
                        ]
                      },
                      {
                        label: 'Backend',
                        items: [
                          { label: 'Supabase', link: '/dev/stack/supabase/' },
                          { label: 'Authentication', link: '/dev/stack/authentication/' },
                        ]
                      },
                      {
                        label: 'AI & Monitoring',
                        items: [
                          { label: 'CrewAI', link: '/dev/tools/crewai/' },
                          { label: 'Langfuse', link: '/dev/tools/langfuse/' },
                        ]
                      },
                      {
                        label: 'Development Tools',
                        items: [
                          { label: 'TypeScript', link: '/dev/stack/typescript/' },
                          { label: 'Testing', link: '/dev/stack/testing/' },
                          { label: 'Turborepo', link: '/dev/stack/turborepo/' },
                          { label: 'Deployment', link: '/dev/stack/deployment/' },
                        ]
                      }
                    ]
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

  markdown: {
    rehypePlugins: [rehypeMermaid],
  },

  adapter: vercel(),
});