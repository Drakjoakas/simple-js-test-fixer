# CircleCI Configuration

This directory contains the CircleCI configuration for automated testing and building of all packages.

## Features

✅ **Smart Change Detection** - Only tests/builds packages that have changed
✅ **Parallel Testing** - All packages test simultaneously
✅ **Dependency Caching** - Fast builds with npm cache
✅ **Monorepo Support** - Workspace-aware testing
✅ **Test Artifacts** - Coverage reports stored for each run

## Workflow Overview

```
┌─────────┐
│  Setup  │  Install dependencies (cached)
└────┬────┘
     │
     ├──────┬──────┬──────┐
     ▼      ▼      ▼      ▼
  ┌──────┬─────┬─────┬────────┐
  │ Core │ Web │ CLI │ Client │  Run tests in parallel
  └──┬───┴──┬──┴──┬──┴───┬────┘
     │      │     │      │
     ▼      ▼     ▼      ▼
  ┌──────┬─────┬─────┬────────┐
  │Build │Build│Build│ Build  │  Build after tests pass
  └──────┴─────┴─────┴────────┘
```

## Jobs

### Setup
- Checks out code
- Installs all dependencies with caching
- Persists workspace for other jobs

### Test Jobs (run in parallel)
- `test-core` - Tests packages/core
- `test-web` - Tests packages/web
- `test-cli` - Tests packages/cli
- `test-client` - Tests packages/client

Each test job:
1. Detects if the package changed
2. Runs tests only if changed (or on main branch)
3. Stores test results and coverage

### Build Jobs (run after tests)
- `build-core` - Builds packages/core
- `build-web` - Builds packages/web
- `build-cli` - Builds packages/cli
- `build-client` - Builds packages/client

Each build job only runs if tests passed.

## Change Detection

The workflow intelligently detects which packages changed:

- **Feature branches**: Only tests changed packages
- **Main branch**: Always tests all packages
- **First commit**: Tests all packages

### How it works

```bash
# Compares current commit with previous commit
git diff --name-only $COMMIT_RANGE | grep "^packages/core/"
```

If any files in `packages/core/` changed, the core tests run.

## Environment Variables

No special environment variables required for basic operation.

For deployment jobs (future):
- `NPM_TOKEN` - For publishing to npm
- `GITHUB_TOKEN` - For creating releases

## Local Testing

You can test the CircleCI config locally using the CircleCI CLI:

```bash
# Install CircleCI CLI
brew install circleci

# Validate config
circleci config validate

# Run a job locally
circleci local execute --job test-core
```

## Caching Strategy

Dependencies are cached using `package-lock.json` checksum:

```yaml
key: v1-dependencies-{{ checksum "package-lock.json" }}
```

To clear cache, bump the version: `v2-dependencies-...`

## Adding New Packages

When you add a new package to the monorepo:

1. Add a test job:
```yaml
test-new-package:
  executor: node-executor
  steps:
    - attach_workspace:
        at: ~/repo
    - detect-changes:
        package: new-package
    - run:
        name: Run Tests
        command: |
          if [ "$(cat /tmp/new-package_changed)" = "true" ]; then
            npm run test --workspace=new-package
          fi
```

2. Add a build job (similar pattern)

3. Add to workflow:
```yaml
workflows:
  test-and-build:
    jobs:
      - test-new-package:
          requires:
            - setup
```

## Optimization Tips

### For Hackathon Speed
Current config is optimized for speed:
- Parallel job execution
- Smart change detection
- Efficient caching

### For Production
Consider adding:
- Lint jobs (eslint, prettier)
- Type checking jobs
- Integration tests
- E2E tests
- Deployment jobs

## Viewing Results

When you push to GitHub:
1. Go to CircleCI dashboard
2. Find your pipeline
3. See all jobs running in parallel
4. Click any job to see logs
5. Download coverage artifacts

## Example Output

```
✓ setup (45s)
  ├─ ✓ test-core (12s)     [CHANGED]
  ├─ ✓ test-web (8s)       [CHANGED]
  ├─ ○ test-cli (2s)       [SKIPPED - no changes]
  └─ ○ test-client (2s)    [SKIPPED - no changes]
     ├─ ✓ build-core (15s)
     ├─ ✓ build-web (20s)
     └─ ○ build-cli [SKIPPED]
```

## Troubleshooting

**Tests not running?**
- Check if `CIRCLE_COMPARE_URL` is set
- Verify git history exists (not a shallow clone)
- Force run by pushing to `main` branch

**Cache issues?**
- Clear by bumping cache version
- Check `package-lock.json` exists

**Build failing?**
- Check individual job logs
- Verify workspace is persisted correctly
- Ensure dependencies are installed
