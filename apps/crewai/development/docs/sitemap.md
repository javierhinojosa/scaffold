# SFH Repository Overview

Last updated: 2023-06-27 14:30:00

```
.
├── .npmrc
├── README.md
├── apps
│   ├── admin
│   │   ├── .astro
│   │   │   ├── collections
│   │   │   ├── content-assets.mjs
│   │   │   ├── content-modules.mjs
│   │   │   ├── content.d.ts
│   │   │   ├── data-store.json
│   │   │   ├── settings.json
│   │   │   └── types.d.ts
│   │   ├── astro.config.mjs
│   │   ├── e2e
│   │   │   ├── auth.spec.ts
│   │   │   └── welcome.spec.ts
│   │   ├── package.json
│   │   ├── playwright.config.ts
│   │   ├── public
│   │   │   └── favicon.svg
│   │   ├── src
│   │   │   ├── assets
│   │   │   │   ├── astro.svg
│   │   │   │   └── background.svg
│   │   │   ├── components
│   │   │   │   ├── LoginForm.svelte
│   │   │   │   ├── ThemeToggle.svelte
│   │   │   │   ├── UserProfile.astro
│   │   │   │   ├── Welcome.astro
│   │   │   │   └── Welcome.test.ts
│   │   │   ├── layouts
│   │   │   │   └── Layout.astro
│   │   │   ├── lib
│   │   │   │   ├── __tests__
│   │   │   │   │   └── auth.test.ts
│   │   │   │   ├── auth-check.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── stores
│   │   │   │   │   ├── auth.ts
│   │   │   │   │   └── theme.ts
│   │   │   │   └── supabase.ts
│   │   │   ├── pages
│   │   │   │   ├── [...404].astro
│   │   │   │   ├── dashboard.astro 
│   │   │   │   ├── index.astro
│   │   │   │   └── login.astro
│   │   │   └── styles
│   │   │       └── global.css
│   │   ├── tailwind.config.mjs
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   ├── crewai
│   │   └── development
│   │       ├── README.md
│   │       ├── docs
│   │       │   ├── sitemap.md
│   │       │   └── validation_report.md
│   │       ├── get-pip.py
│   │       ├── knowledge
│   │       │   └── user_preference.txt
│   │       ├── pyproject.toml
│   │       ├── report.md
│   │       ├── src
│   │       │   └── development
│   │       │       ├── __init__.py
│   │       │       ├── config
│   │       │       ├── crew.py
│   │       │       ├── main.py
│   │       │       └── tools
│   │       ├── tests
│   │       └── uv.lock
│   └── docs
│       ├── .astro
│       │   ├── collections
│       │   │   └── docs.schema.json
│       │   ├── content-assets.mjs
│       │   ├── content-modules.mjs
│       │   ├── content.d.ts
│       │   ├── data-store.json
│       │   ├── settings.json
│       │   └── types.d.ts
│       ├── astro.config.mjs
│       ├── package.json
│       ├── public
│       │   └── favicon.svg
│       ├── src
│       │   ├── assets
│       │   │   └── houston.webp
│       │   ├── content
│       │   │   └── docs
│       │   │       ├── dev
│       │   │       ├── index.mdx
│       │   │       └── reference
│       │   └── content.config.ts
│       └── tsconfig.json
├── package.json
├── packages
│   ├── backend
│   │   ├── .turbo
│   │   ├── README.md
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── __tests__
│   │   │   │   └── auth.test.ts
│   │   │   ├── auth.ts
│   │   │   ├── index.ts
│   │   │   ├── schema.sql
│   │   │   ├── test-utils.ts
│   │   │   └── types.ts
│   │   ├── supabase
│   │   │   ├── config.toml
│   │   │   └── migrations
│   │   │       └── 20240211_initial_schema.sql
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   └── testing
│       ├── .turbo
│       ├── package.json
│       ├── setup.ts
│       ├── src
│       │   ├── auth.ts
│       │   ├── index.ts
│       │   └── setup.ts
│       ├── tsconfig.json
│       └── vitest-preset.ts
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── scripts
│   └── sync-knowledge.js
├── tsconfig.base.json
└── turbo.json
```

## Root Structure

- `apps/`: Contains the main application code
- `packages/`: Shared code and libraries used across apps
- `scripts/`: Utility and automation scripts

## Key Components

### apps/admin

The admin application, built with Astro. Includes end-to-end tests with Playwright, Svelte components, auth and data fetching logic, and static pages.

### apps/crewai

An AI-related module with configuration, documented API, and validation utilities. Uses Python.

### apps/docs 

Project documentation site, also built with Astro. Content is authored in MDX.

### packages/backend

Shared backend package providing a type-safe Supabase client. Types are generated from the Supabase schema. Includes auth handling, tests, and database migrations.

### packages/testing  

Common testing utilities and configuration for use across the monorepo.

## Important Relationships

- All apps share code from the `packages/` directory
- `packages/backend` provides Supabase client for data access
- `packages/testing` sets up consistent testing across apps
- Turborepo is used to manage the monorepo and its workspaces

Let me know if you have any other questions!