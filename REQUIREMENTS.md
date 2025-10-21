# TestFixer AI - Automated Test Repair Service

## What are we building?

### One-Line Pitch
An AI-powered web service that automatically fixes failing tests in CI/CD pipelines and creates pull requests with the solutions.

### The Problem
Developers waste 30-60 minutes per day fixing broken tests caused by legitimate code changes - updating snapshots, adjusting assertions, fixing mocks. These aren't real bugs, just tests that need updating after refactoring or API changes.

### The Solution
TestFixer AI monitors your CircleCI pipelines, detects test failures, analyzes what changed, and automatically creates pull requests with appropriate test fixes. It handles the tedious test maintenance so developers can focus on building features.

### Core Value Proposition
- **Save Time**: Eliminate 80% of routine test maintenance work
- **Reduce Context Switching**: No more interrupting feature work to fix tests
- **Faster CI/CD**: Get back to green builds quickly
- **Learning Tool**: See how tests should be updated based on code changes

---

## How are we building it?
### Core Workflow
1. **Connect**: User connects CircleCI and GitHub via OAuth or API tokens
2. **Monitor**: Dashboard shows recent pipeline failures with test errors
3. **Analyze**: On "Fix" button click:
   - Fetch test failure logs from CircleCI
   - Get the commit diff that triggered the failure
   - Retrieve current test file content from GitHub
4. **Fix**: AI generates appropriate fixes based on:
   - Error messages and stack traces
   - Recent code changes
   - Test file context
5. **Review**: Create PR with detailed explanation of changes

### Data Flow
```javascript
// 1. Fetch failures
CircleCI → Failed job details → Parse test results (JUnit XML)

// 2. Gather context
GitHub → Get commit diff + test file content + source changes

// 3. Generate fix
Context + Errors → OpenAI GPT-4 → Validated fix code

// 4. Create PR
GitHub API → New branch → Commit fixes → Open PR with description
```

---

## How does success look like?

### Demo Success Metrics
✅ **Connect** to repository in < 1 minute  
✅ **Display** failed pipelines with clear test failure reasons  
✅ **Fix** 3 different types of test failures live  
✅ **Create** PRs that actually pass CI when merged  
✅ **Show** time saved: "Fixed in 30 seconds vs 30 minutes manually"

### Types of Successful Fixes

#### 1. Snapshot Updates (Most Common)
- **Before**: `Snapshot mismatch in Button.test.js`
- **After**: PR with updated snapshot file

#### 2. Assertion Updates (High Value)
- **Before**: `Expected 'userId' but got 'user_id'`
- **After**: PR updating all affected assertions

#### 3. Mock Adjustments (Impressive)
- **Before**: `Mock returning outdated schema`
- **After**: PR with updated mock responses

### User Experience Success
- **Zero to Fixed**: From red build to green PR in under 2 minutes
- **Trust Building**: PR descriptions explain exactly what changed and why
- **Safe Failures**: When uncertain, bot comments "Needs human review" instead of bad fixes

---

## Project Scope & Limitations

### ✅ IN SCOPE - What We Support

#### Languages & Frameworks
- **Languages**: JavaScript and TypeScript only
- **Test Runners**: Jest only (covers 70% of JS projects)
- **File Types**: `.test.js`, `.test.ts`, `.spec.js`, `.spec.ts`

#### Test Failure Types We Fix
1. **Snapshot mismatches** - Update snapshots when UI legitimately changed
2. **Simple assertion failures** - Update expected values when API responses change
3. **Property name changes** - Fix renamed fields/methods
4. **Type errors** - Update TypeScript types in tests
5. **Missing mocks** - Add mocks for new dependencies

#### CI/CD Support
- **CircleCI only** (can demo with free tier)
- **Public and private repos** (with proper tokens)
- **GitHub only** for version control
