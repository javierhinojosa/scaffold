# Scaffold Monorepo

This monorepo contains the full stack application suite for scaffolding projects, including web applications, documentation, and shared packages.

## 📦 Project Structure

```
.
├── apps/
│   ├── admin/        # Admin dashboard application
│   ├── crewai/       # CrewAI development and configuration
│   └── docs/         # Documentation site
├── packages/
│   ├── backend/      # Shared backend services and API
│   └── testing/      # Common testing utilities
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- PNPM (v8 or later)
- Python 3.9+ (for CrewAI components)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/javierhinojosa/scaffold.git
cd scaffold
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up Python virtual environment (for CrewAI):

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r apps/crewai/development/requirements.txt
```

4. Create environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration values.

## 🛠️ Development

### Running Applications

Each application can be started independently:

```bash
# Start admin dashboard
pnpm --filter admin dev

# Start documentation site
pnpm --filter docs dev

# Start CrewAI development
cd apps/crewai/development
crewai run
```

### Project Commands

- `pnpm build`: Build all applications and packages
- `pnpm test`: Run tests across the monorepo
- `pnpm lint`: Lint all code
- `pnpm clean`: Clean build artifacts

## 📚 Documentation

- [Admin Dashboard](/apps/admin/README.md)
- [CrewAI Development](/apps/crewai/development/README.md)
- [Documentation Site](/apps/docs/README.md)
- [Backend Services](/packages/backend/README.md)

## 🤝 Contributing

1. Create a new branch for your feature/fix
2. Make your changes
3. Run tests and linting
4. Submit a pull request
