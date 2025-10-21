# CircleCI Setup Guide

Complete guide to set up and use CircleCI for this monorepo.

## Quick Start

### 1. Connect to CircleCI

1. Go to [CircleCI](https://circleci.com)
2. Sign up/Login with your GitHub account
3. Click "Set Up Project" for this repository
4. CircleCI will automatically detect [.circleci/config.yml](.circleci/config.yml)
5. Click "Start Building"

### 2. First Build

Push any commit and CircleCI will:
- Install dependencies
- Run tests for all packages in parallel
- Build packages that pass tests
- Store coverage reports

### 3. View Results

- Dashboard: `https://app.circleci.com/pipelines/github/YOUR_USERNAME/simple-js-test-fixer`
- See all jobs running in parallel
- Download test artifacts and coverage

## How It Works

### Workflow Diagram

```
Push to GitHub
      │
      ▼
┌───────────────────┐
│   Setup Job       │  Checkout + Install deps (cached)
└─────────┬─────────┘
          │
    ┌─────┴─────┬─────────┬─────────┐
    │           │         │         │
    ▼           ▼         ▼         ▼
┌──────┐  ┌──────┐  ┌──────┐  ┌────────┐
│ Core │  │ Web  │  │ CLI  │  │Client  │  Tests (parallel)
│ Test │  │ Test │  │ Test │  │ Test   │  Only if changed
└───┬──┘  └───┬──┘  └───┬──┘  └───┬────┘
    │         │         │         │
    ▼         ▼         ▼         ▼
┌──────┐  ┌──────┐  ┌──────┐  ┌────────┐
│ Core │  │ Web  │  │ CLI  │  │Client  │  Builds
│Build │  │Build │  │Build │  │ Build  │  Only if tests pass
└──────┘  └──────┘  └──────┘  └────────┘
```

### Smart Change Detection

**When you modify `packages/core/`:**
```bash
✓ test-core     # RUNS - Changes detected
○ test-web      # SKIPPED - No changes
○ test-cli      # SKIPPED - No changes
○ test-client   # SKIPPED - No changes
```

**When you modify multiple packages:**
```bash
✓ test-core     # RUNS - Changes detected
✓ test-web      # RUNS - Changes detected
○ test-cli      # SKIPPED - No changes
○ test-client   # SKIPPED - No changes
```

**On main branch:**
```bash
✓ test-core     # ALWAYS RUNS
✓ test-web      # ALWAYS RUNS
✓ test-cli      # ALWAYS RUNS
✓ test-client   # ALWAYS RUNS
```

## Package-Specific Testing

### Testing Individual Packages Locally

```bash
# Core package (Jest)
npm run test:core

# Web package
npm run test:web

# CLI package
npm run test:cli

# Client package (Vite)
npm run test:client

# All packages
npm test
```

### Testing CircleCI Config Locally

Install CircleCI CLI:
```bash
# macOS
brew install circleci

# Linux
curl -fLSs https://circle.ci/cli | bash

# Verify installation
circleci version
```

Validate config:
```bash
npm run ci:validate
# or
circleci config validate
```

Run a job locally:
```bash
npm run ci:test-local
# or
circleci local execute --job test-core
```

## Configuration Details

### Jobs Overview

| Job | Description | Runs When |
|-----|-------------|-----------|
| `setup` | Install dependencies | Always |
| `test-core` | Test core package | Core files changed or main branch |
| `test-web` | Test web package | Web files changed or main branch |
| `test-cli` | Test CLI package | CLI files changed or main branch |
| `test-client` | Test client package | Client files changed or main branch |
| `build-*` | Build packages | After tests pass |

### Caching Strategy

Dependencies are cached based on `package-lock.json`:

```yaml
key: v1-dependencies-{{ checksum "package-lock.json" }}
```

**Cache hit:** Dependencies restored in ~5 seconds
**Cache miss:** Full install takes ~30 seconds

To clear cache:
1. Update cache key version: `v2-dependencies-...`
2. Push change
3. Old cache will be ignored

### Artifacts

Test results and coverage are stored:

```yaml
- store_test_results:
    path: packages/core/coverage
- store_artifacts:
    path: packages/core/coverage
```

Access artifacts:
1. Go to job details
2. Click "Artifacts" tab
3. Download coverage reports

## Advanced Usage

### Environment Variables

Set in CircleCI UI: Project Settings > Environment Variables

Common variables for future use:
- `NPM_TOKEN` - For publishing to npm
- `GITHUB_TOKEN` - For GitHub releases
- `CODECOV_TOKEN` - For coverage reporting

### Custom Test Commands

Add to package-specific `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

Update CircleCI config:
```yaml
- run: npm run test:ci --workspace=core
```

### Matrix Jobs (Future)

Test across multiple Node versions:

```yaml
executors:
  node-20:
    docker:
      - image: cimg/node:20.18.2
  node-18:
    docker:
      - image: cimg/node:18.19.0

jobs:
  test-core:
    parameters:
      executor:
        type: executor
    executor: << parameters.executor >>
    # ... rest of job

workflows:
  test:
    jobs:
      - test-core:
          matrix:
            parameters:
              executor: [node-20, node-18]
```

## Monitoring & Insights

### Pipeline Insights

CircleCI provides:
- **Success rate** - Percentage of passing builds
- **Duration trends** - Are builds getting slower?
- **Flaky tests** - Tests that intermittently fail
- **Resource usage** - Credits/minutes consumed

Access: Project page > Insights tab

### Status Badges

Add to README:

```markdown
[![CircleCI](https://circleci.com/gh/YOUR_USERNAME/simple-js-test-fixer.svg?style=svg)](https://circleci.com/gh/YOUR_USERNAME/simple-js-test-fixer)
```

### Notifications

Configure in: Project Settings > Notifications
- Slack integration
- Email alerts
- Webhook for custom integrations

## Troubleshooting

### Common Issues

**"No tests found"**
```bash
# Ensure test script exists in package.json
{
  "scripts": {
    "test": "jest"  // or vitest, etc.
  }
}
```

**"Permission denied" on npm install**
```yaml
# Use npm ci instead of npm install
- run: npm ci
```

**Change detection not working**
```bash
# Check git history exists
git log --oneline | head -5

# Ensure CIRCLE_COMPARE_URL is set
echo $CIRCLE_COMPARE_URL
```

**Cache is stale**
```yaml
# Bump cache version
key: v2-dependencies-{{ checksum "package-lock.json" }}
```

### Debug Mode

Add to job for verbose output:

```yaml
- run:
    name: Debug Info
    command: |
      echo "Node version: $(node --version)"
      echo "NPM version: $(npm --version)"
      echo "Changed files:"
      git diff --name-only HEAD~1
```

## Performance Tips

### Current Performance

- **Setup:** ~30s (first run), ~5s (cached)
- **Tests:** Run in parallel (~10-20s each)
- **Builds:** Run in parallel (~15-30s each)
- **Total:** ~1-2 minutes for typical PR

### Optimization Strategies

1. **Persistent caching** (implemented) ✅
2. **Parallel jobs** (implemented) ✅
3. **Smart change detection** (implemented) ✅
4. **Workspace persistence** (implemented) ✅

Future optimizations:
- Docker layer caching
- Test splitting for large test suites
- Reusable config with orbs

## Next Steps

### For Hackathon
Current setup is optimized for speed. You're ready to go!

### For Production
Consider adding:

1. **Linting Jobs**
```yaml
lint:
  steps:
    - run: npm run lint
```

2. **Type Checking**
```yaml
typecheck:
  steps:
    - run: npm run typecheck
```

3. **Integration Tests**
```yaml
test-integration:
  steps:
    - run: npm run test:integration
```

4. **Deployment**
```yaml
deploy:
  steps:
    - run: npm run deploy
  filters:
    branches:
      only: main
```

## Resources

- [CircleCI Docs](https://circleci.com/docs/)
- [Node Orb Docs](https://circleci.com/developer/orbs/orb/circleci/node)
- [Monorepo Best Practices](https://circleci.com/blog/monorepo-dev-practices/)
- [Config Reference](https://circleci.com/docs/configuration-reference/)
