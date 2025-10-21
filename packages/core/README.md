# TestFixer Core

Core business logic for automated test fixing. This package is shared between the CLI and web applications.

## Architecture

```
/core
  /models         - Data models (TestFailure, FixResult, PRData)
  /services       - Business logic services
  /strategies     - Fix strategies for different failure types
  /integrations   - API clients (CircleCI, GitHub, OpenAI)
```

## Quick Start

```typescript
import { TestFixerOrchestrator } from '@testfixer/core';

const fixer = new TestFixerOrchestrator({
  circleci: { apiToken: process.env.CIRCLECI_TOKEN },
  github: {
    token: process.env.GITHUB_TOKEN,
    owner: 'your-org',
    repo: 'your-repo'
  },
  openai: { apiKey: process.env.OPENAI_API_KEY }
});

// Complete workflow
const pr = await fixer.fixFailuresAndCreatePR('gh/org/repo', 12345);
console.log(`PR created: ${pr.url}`);
```

## Services

### TestAnalyzer
Analyzes test failures and categorizes them by type (snapshot, assertion, mock, etc.)

### FixGenerator
Orchestrates fix generation using appropriate strategies based on failure type

### PRCreator
Prepares pull request data with detailed descriptions

## Strategies

- **SnapshotFixStrategy** - Handles snapshot mismatches
- **AssertionFixStrategy** - Fixes simple assertion value changes
- **AIFixStrategy** - Uses OpenAI for complex fixes (mocks, type errors, unknown)

## Integrations

- **CircleCIClient** - Fetches pipeline data and test results
- **GitHubClient** - Manages file content, diffs, and PR creation
- **OpenAIClient** - Generates AI-powered fixes

## Usage Patterns

### Step-by-step workflow

```typescript
// 1. Fetch failures
const failures = await fixer.fetchTestFailures('gh/org/repo', 12345);

// 2. Analyze
const analyzed = await fixer.analyzeFailures(failures);

// 3. Generate fixes
const proposal = await fixer.generateFixes(analyzed, 'gh/org/repo');

// 4. Create PR
const pr = await fixer.createPR(proposal);
```

### Custom strategy registration

```typescript
import { FixGenerator } from '@testfixer/core';

const generator = new FixGenerator();
generator.registerStrategy('custom-type', new MyCustomStrategy());
```
