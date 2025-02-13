# SFH Repository Overview

This repository contains the full stack application suite for SFH, including web applications, documentation, and shared packages.

## Repository Structure

```
.
├── .npmrc
├── .turbo
│   ├── cache
│   ├── cookies
│   │   └── 1.cookie
│   └── daemon
│       └── 605000514d22dff7-turbo.log.2025-02-13
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
│   │       ├── requirements.txt
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

## Top-Level Structure

- `.npmrc`, `.turbo/`: Configuration for npm and Turbo monorepo tools
- `README.md`: Overview documentation for the repository
- `apps/`: Contains the main applications of the project
- `packages/`: Shared packages used across applications
- `scripts/`: Utility and development scripts
- `pnpm-workspace.yaml`, `package.json`, `turbo.json`: Monorepo configuration
- `tsconfig.base.json`: Base TypeScript configuration extended by apps/packages

## Applications (`apps/`)

### `admin/`

An Astro admin dashboard application. Key components:

- `src/`: Main source code including pages, components, styles
- `src/lib/`: Utility modules and Supabase client configuration
- `astro.config.mjs`: Astro configuration
- `tailwind.config.mjs`: Tailwind CSS configuration

### `crewai/development/`

Development files for automated repository documentation with crewAI. Key components:

- `src/development/`: CrewAI agent and execution logic
- `src/development/config/`: Configuration for agents and tasks
- `docs/`: Generated sitemap and validation reports
- `README.md`: Overview and setup instructions for crewAI development

### `docs/`

An Astro documentation site. Key components:

- `src/content/docs/`: Markdown documentation files
- `src/content.config.ts`: Configuration for loading docs content
- `astro.config.mjs`: Astro configuration

## Packages (`packages/`)

### `backend/`

Shared backend services and APIs. Key components:

- `src/`: Main source code
- `supabase/`: Supabase configuration and migrations
- `vitest.config.ts`: Vitest unit testing configuration

### `testing/`

Common testing utilities and configuration. Key components:

- `src/`: Main source code
- `vitest-preset.ts`: Vitest configuration preset

## Important Relationships

- Apps import and use shared packages (`packages/`) for backend services and testing
- `backend/` package provides APIs and Supabase integration used by apps
- `testing/` package provides common test configuration and utilities for all apps and packages
- Monorepo scripts (`scripts/`) automate common tasks across apps and packages

Last updated: 2023-06-19 10:30:00
