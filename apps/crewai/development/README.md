# Development Crew

Welcome to the Development Crew project, powered by [crewAI](https://crewai.com). This specialized crew is designed to maintain and improve repository documentation through automated analysis and generation of documentation artifacts.

## Installation

Ensure you have Python >=3.10 <3.13 installed on your system. This project uses [UV](https://docs.astral.sh/uv/) for dependency management and package handling, offering a seamless setup and execution experience.

First, if you haven't already, install uv:

```bash
pip install uv
```

Next, navigate to your project directory and install the dependencies:

(Optional) Lock the dependencies and install them by using the CLI command:

```bash
crewai install
```

## Crew Structure

### Agents

The Development Crew consists of two specialized agents:

1. **Repository Structure Documentation Specialist**

   - Role: Creates comprehensive repository structure overviews
   - Tools:
     - Generate file tree (up to 5 levels deep)
     - List directory contents
     - Read file contents
   - Focus: High-level organization and component relationships

2. **Documentation Quality Analyst**
   - Role: Identifies documentation gaps and suggests improvements
   - Tools:
     - List directory contents
     - Read file contents
     - Generate file tree
   - Focus: Critical documentation gaps and actionable improvements

### Tasks

The crew performs two main tasks:

1. **Sitemap Generation**

   - Creates a comprehensive repository overview
   - Outputs: `docs/sitemap.md`
   - Deliverables:
     - Complete file tree (up to 5 levels)
     - Root structure explanation
     - Key component descriptions
     - Important relationships
     - Last updated timestamp

2. **Documentation Validation**
   - Analyzes documentation coverage and gaps
   - Outputs: `docs/validation_report.md`
   - Deliverables:
     - List of critical documentation gaps (max 5)
     - Quick fix suggestions
     - Priority levels for each gap
     - Focused on major gaps affecting project understanding

## Running the Project

To execute the documentation maintenance crew:

```bash
$ crewai run
```

This will:

1. Generate a comprehensive sitemap of your repository
2. Analyze existing documentation and identify gaps
3. Create two output files in the `docs/` directory

## Configuration

The crew's behavior can be customized through:

- `src/development/config/agents.yaml`: Define agent roles and capabilities
- `src/development/config/tasks.yaml`: Configure documentation tasks and outputs
- `src/development/crew.py`: Customize tools and execution logic

## Support

For support, questions, or feedback:

- Visit our [documentation](https://docs.crewai.com)
- Reach out through our [GitHub repository](https://github.com/joaomdmoura/crewai)
- [Join our Discord](https://discord.com/invite/X4JWnZnxPb)
- [Chat with our docs](https://chatg.pt/DWjSBZn)

Let's create wonders together with the power and simplicity of crewAI.
