Project Structure:
- `.turbo`: Used for storing various settings and cache-related data for the turbo software (preferences, cache, daemon, cookies)
- `apps`: Contains application-specific directories:
  - `crewai`: Core application directory with development-specific code separate from production code, including source code, documentation, and tests.
  - `admin`: Contains a configuration-driven application with its own configurations and tests.
  - `docs`: Holds the project's documentation, set up similarly to an app for generating a documentation site with static site generation.
- `packages`: Houses shared and reusable code. Contains `backend` (server-side logic) and `testing` (testing utilities and test setup related tasks) packages.
- `scripts`: Contains scripts useful for the project, like `sync-knowledge.js` for managing knowledge-related data.

The file tree for the project `/Users/jhs/Projects/sfh` (up to 5 levels deep):
```
├── .npmrc
├── .turbo
│   ├── cache
│   ├── cookies
│   ├── daemon
│   └── preferences
├── apps
│   ├── admin
│   ├── crewai
│   │   └── development
│   └── docs
├── package.json
├── packages
│   ├── backend
│   └── testing
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── scripts
│   └── sync-knowledge.js
├── tsconfig.base.json
└── turbo.json
```
Reference for Key Components:
- `.turbo`: Settings and cache-related data.
- `apps/crewai/development`: Core, development-specific source code.
- `apps/admin`: Admin functionality of the project.
- `apps/docs`: Project documentation in markdown.
- `packages/backend`: Server-side logic package for the project.
- `packages/testing`: Package for testing utilities and setup.
- `scripts/sync-knowledge.js`: Script for managing knowledge-related data.

The repository structure was last documented on `<date>` (Current date is used on replacement).