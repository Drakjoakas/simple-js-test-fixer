[![CircleCI](https://dl.circleci.com/status-badge/img/circleci/SD8BKAP3EYCnJVovd8GWn/YHX2QtjrpyKThv3VeEgTZv/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/circleci/SD8BKAP3EYCnJVovd8GWn/YHX2QtjrpyKThv3VeEgTZv/tree/main)

# simple-js-test-fixer

Simple Automated Test fixer working with CircleCI API to fetch failed pipeline logs and Github to fetch PR changes to understand and fix broken tests. Limited to JS projects. Built for Product Summit 2025 Buildathon.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Package Overview](#package-overview)
- [Getting Started](#getting-started)
- [Usage](#usage)
  - [Development Mode](#development-mode)
  - [Building](#building)
  - [Individual Package Usage](#individual-package-usage)
- [Managing Dependencies](#managing-dependencies)
- [Configuration](#configuration)

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (v9 or higher)
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd simple-js-test-fixer
```

2. Install dependencies for all packages:
```bash
npm install
```

This will install dependencies for the root workspace and all packages (client, core, web, cli) thanks to npm workspaces.

3. Set up environment variables:

**For the Web package (backend):**
```bash
cp packages/web/.env.example packages/web/.env
```
Then edit `packages/web/.env` and add your API tokens:
- `CIRCLECI_TOKEN` - Get from [CircleCI Personal API Tokens](https://app.circleci.com/settings/user/tokens)
- `GITHUB_TOKEN` - Get from [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- `OPENAI_API_KEY` - Get from [OpenAI API Keys](https://platform.openai.com/api-keys)

**For the Client package (frontend):**
```bash
cp packages/client/.env.example packages/client/.env
```
Edit if you need to change the backend API URL (default is `http://localhost:3000`).

## Project Structure

This is a monorepo using npm workspaces with the following packages:

```
simple-js-test-fixer/
├── packages/
│   ├── client/       # React frontend (Vite + React)
│   ├── core/         # Shared core logic and utilities
│   ├── web/          # Express backend API server
│   └── cli/          # Command-line interface
├── package.json      # Root workspace configuration
└── README.md
```

## Package Overview

### 📦 Core (`packages/core`)
Shared business logic, models, and utilities used across all packages.

**Dependencies:**
- `@octokit/rest` - GitHub API client
- `axios` - HTTP client
- `diff` - Text diffing utilities
- `openai` - OpenAI API integration
- `winston` - Logging

**Key Features:**
- CircleCI API integration
- GitHub API integration
- Test failure analysis
- AI-powered fix suggestions

### 🌐 Web (`packages/web`)
Express.js backend server providing REST API endpoints.

**Dependencies:**
- `express` - Web framework
- `cors` - CORS middleware
- `helmet` - Security headers
- `zod` - Schema validation
- `dotenv` - Environment configuration

**Port:** Configurable via environment (typically 3000)

### 💻 Client (`packages/client`)
React-based frontend application built with Vite.

**Dependencies:**
- `react` - UI library
- `react-dom` - React DOM renderer
- `vite` - Build tool and dev server

**Port:** Configurable via Vite (typically 5173)

### 🔧 CLI (`packages/cli`)
Command-line interface for running test fixer operations.

**Dependencies:**
- `commander` - CLI framework
- `inquirer` - Interactive prompts
- `chalk` - Terminal colors
- `ora` - Terminal spinners
- `conf` - Configuration management

## Getting Started

### Quick Start - Development Mode

Run all services simultaneously:

```bash
npm run dev
```

This starts:
- Client (React frontend) in development mode
- Web (Express backend) in development mode with hot reload

### Run CLI

```bash
npm run start:cli
```

## Usage

### Development Mode

#### Start All Services
```bash
npm run dev
```
Runs both client and web packages concurrently with hot reload.

#### Start Individual Services

**Client (Frontend):**
```bash
npm run dev:client
# or
npm run dev --workspace=client
```

**Web (Backend):**
```bash
npm run dev:web
# or
npm run dev --workspace=web
```

**CLI:**
```bash
npm run start:cli
# or
npm run start --workspace=cli
```

### Building

#### Build All Packages
```bash
npm run build
```
Builds all packages that have a build script.

#### Build Individual Packages

**Core:**
```bash
npm run build --workspace=core
```

**Web:**
```bash
npm run build --workspace=web
```

**Client:**
```bash
npm run build --workspace=client
```

**CLI:**
```bash
npm run build --workspace=cli
```

### Running Tests

#### Run All Tests
```bash
npm test
```

#### Run Tests for Specific Package
```bash
npm test --workspace=<package-name>
# Example:
npm test --workspace=core
```

### Individual Package Usage

#### Core Package
```bash
cd packages/core
npm run build          # Compile TypeScript
npm test              # Run tests
```

#### Web Package
```bash
cd packages/web
npm run dev           # Start with hot reload (tsx watch)
npm run build         # Build production bundle
npm start             # Run production build
```

#### Client Package
```bash
cd packages/client
npm run dev           # Start Vite dev server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint
```

#### CLI Package
```bash
cd packages/cli
npm start             # Run CLI with tsx
npm run build         # Build TypeScript
```

## Managing Dependencies

### Install Dependencies

#### Add to Root (Development Dependencies)
```bash
npm install <package-name> --save-dev
# Example: npm install prettier --save-dev
```

#### Add to Specific Package
```bash
npm install <package-name> --workspace=<workspace-name>
# Example: npm install axios --workspace=web
```

#### Add to Multiple Packages
```bash
npm install <package-name> --workspace=client --workspace=web
```

#### Install Dev Dependency to Specific Package
```bash
npm install <package-name> --save-dev --workspace=<workspace-name>
# Example: npm install @types/express --save-dev --workspace=web
```

### Remove Dependencies

```bash
npm uninstall <package-name> --workspace=<workspace-name>
# Example: npm uninstall axios --workspace=web
```

### Update Dependencies

```bash
# Update all dependencies
npm update

# Update specific package dependencies
npm update --workspace=<workspace-name>
```

### Link Local Packages

Packages can reference each other within the workspace. Add to `package.json`:

```json
{
  "dependencies": {
    "core": "*"
  }
}
```

Then run `npm install` to link them.

## Configuration

### Environment Variables

Environment variables are managed using `.env` files. Example files are provided for each package.

#### Required Environment Variables

**Web Package** (`packages/web/.env`):

Copy the example file and fill in your credentials:
```bash
cp packages/web/.env.example packages/web/.env
```

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `3000` |
| `NODE_ENV` | Environment mode | No | `development` |
| `CIRCLECI_TOKEN` | CircleCI Personal API Token | Yes | - |
| `GITHUB_TOKEN` | GitHub Personal Access Token | Yes | - |
| `OPENAI_API_KEY` | OpenAI API Key | Yes | - |
| `CIRCLECI_BASE_URL` | Custom CircleCI API URL | No | `https://circleci.com/api/v2` |
| `GITHUB_BASE_URL` | Custom GitHub API URL | No | `https://api.github.com` |
| `OPENAI_BASE_URL` | Custom OpenAI API URL | No | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | OpenAI model to use | No | `gpt-4` |

**Client Package** (`packages/client/.env`):

Copy the example file:
```bash
cp packages/client/.env.example packages/client/.env
```

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | No | `http://localhost:3000` |

#### Getting API Tokens

1. **CircleCI Token**:
   - Go to [CircleCI User Settings](https://app.circleci.com/settings/user/tokens)
   - Click "Create New Token"
   - Give it a name and copy the token

2. **GitHub Token**:
   - Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (all), `workflow`
   - Copy the generated token

3. **OpenAI API Key**:
   - Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Click "Create new secret key"
   - Copy the key immediately (it won't be shown again)

**Important**: Never commit `.env` files to version control. They are already included in `.gitignore`.

### Available Scripts (Root)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start client and web in development mode |
| `npm run dev:client` | Start only client in dev mode |
| `npm run dev:web` | Start only web in dev mode |
| `npm run start:cli` | Run the CLI tool |
| `npm run build` | Build all packages |
| `npm test` | Run tests with Vitest |

## Troubleshooting

### Clear node_modules and Reinstall
```bash
rm -rf node_modules packages/*/node_modules
npm install
```

### Build Issues
If you encounter build errors, try building packages in order:
```bash
npm run build --workspace=core
npm run build --workspace=web
npm run build --workspace=client
npm run build --workspace=cli
```

### Port Conflicts
If ports are already in use, modify the port in the respective package's configuration or `.env` file.

## License

ISC
