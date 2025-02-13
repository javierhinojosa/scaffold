---
title: Documentation Site
description: Learn how to use and customize the Starlight-powered documentation site
---

## Overview

The documentation site in this monorepo is built using [Starlight](https://starlight.astro.build/), a documentation framework powered by Astro. This guide will help you understand how it's set up and how to extend it.

## Configuration

The documentation site is configured in `apps/docs/astro.config.mjs`. Here are the key features and how to customize them:

### Base Configuration

```js
import starlight from '@astrojs/starlight';
import starlightSidebarTopicsDropdown from 'starlight-sidebar-topics-dropdown';
import starlightLinksValidator from 'starlight-links-validator';
import starlightGiscus from 'starlight-giscus';
import rehypeMermaid from 'rehype-mermaid';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Scaffold Documentation',
      social: {
        github: 'https://github.com/yourusername/scaffold',
      },
      logo: {
        src: './src/assets/logo.png',
        alt: 'Scaffold Logo',
      },
      // ... other config
    }),
  ],
});
```

### Features and Plugins

The documentation site includes several powerful plugins:

#### 1. Topics Dropdown Navigation

Using `starlight-sidebar-topics-dropdown`, the sidebar is organized into collapsible topic sections. Configure topics in `astro.config.mjs`:

```js
starlightSidebarTopicsDropdown([
  {
    label: 'Development',
    link: '/dev/',
    icon: 'open-book',
    items: [
      // Add your navigation items here
    ],
  },
  // Add more top-level sections
]);
```

#### 2. Comments Integration

[Giscus](https://giscus.app/) provides GitHub-powered comments. Configure it in your config:

```js
starlightGiscus({
  repo: 'yourusername/scaffold',
  repoId: 'your-repo-id',
  category: 'Announcements',
  categoryId: 'your-category-id',
});
```

#### 3. Link Validation

The `starlight-links-validator` plugin automatically checks for broken links during build time.

#### 4. Diagrams Support

[Mermaid](https://mermaid.js.org/) diagrams are supported through `rehype-mermaid`:

```js
markdown: {
  rehypePlugins: [rehypeMermaid],
}
```

## Adding Content

### Directory Structure

Documentation content lives in `apps/docs/src/content/docs/`. The structure follows Starlight conventions:

```
content/docs/
├── index.mdx           # Home page
├── dev/               # Development docs
│   ├── getting-started/
│   ├── stack/
│   └── apps/
└── reference/         # API reference
```

### Creating New Pages

1. Create a new `.md` or `.mdx` file in the appropriate directory
2. Add frontmatter with title and description:
   ```md
   ---
   title: Your Page Title
   description: A brief description of the page
   ---
   ```
3. Add your content using Markdown

### Using Components

You can use Astro components in `.mdx` files:

```mdx
---
title: Page with Components
---

import { MyComponent } from '@/components/MyComponent';

<MyComponent prop="value" />
```

## Customization

### Styling

- Global styles: Edit `src/styles/global.css`
- Theme customization: Modify the Starlight theme options in `astro.config.mjs`

### Navigation

Update the sidebar configuration in `astro.config.mjs` to modify the navigation structure:

```js
sidebar: [
  {
    label: 'Getting Started',
    items: [
      { label: 'Introduction', link: '/' },
      // Add more items
    ],
  },
];
```

## Deployment

The documentation site is configured to deploy on Vercel using the Astro adapter:

```js
import vercel from '@astrojs/vercel';

export default defineConfig({
  // ... other config
  adapter: vercel(),
});
```

## Best Practices

1. **Organization**: Keep related documentation together in subdirectories
2. **Images**: Store images in `src/assets/` and reference them using relative paths
3. **Components**: Create reusable components for common documentation patterns
4. **Versioning**: Consider using git tags to version your documentation
5. **Search**: Write clear, searchable content with good headings and keywords
