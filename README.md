# Scaffold Monorepo

A modern full-stack application suite for scaffolding projects, featuring web applications, AI services, and shared packages.

## Quick Start

1. **Prerequisites**

   - Node.js (v12+)
   - pnpm (v8.15.4+)
   - Python (v3.11+)
   - Poetry (v1.7+)
   - Docker Desktop

2. **Setup**

   ```bash
   # Clone repository
   git clone https://github.com/javierhinojosa/scaffold.git
   cd scaffold

   # Install dependencies
   pnpm install

   # Set up environment variables
   cp .env.example .env
   ```

3. **Development**

   ```bash
   # Start all services
   pnpm turbo dev

   # Or start specific apps
   pnpm dev --filter <app-name>
   ```

## Documentation

For detailed setup instructions, development guides, and architecture documentation, visit our [documentation site](http://localhost:4321) after running:

```bash
pnpm dev --filter docs
```

## License

MIT
