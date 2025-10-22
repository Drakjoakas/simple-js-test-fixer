# API Flow Guide for Frontend

## Understanding CircleCI Data Structure

The key insight is that **pipelines don't have a direct status field**. Instead, you need to:

1. **Pipeline** → Contains workflows
2. **Workflow** → Has a status field (`success`, `failed`, `running`)
3. **Job** → Individual task within a workflow (also has status)

## Complete Frontend Flow

### Step 1: List All Pipelines (with Status)

```bash
GET /api/pipelines?slug=gh/owner/repo&limit=20
```

**Response:**
```json
{
  "message": "Pipelines retrieved successfully",
  "count": 20,
  "pipelines": [
    {
      "id": "abc-123",
      "number": 42,
      "created_at": "2025-10-21T...",
      "vcs": {
        "branch": "main",
        "revision": "abc123"
      },
      "status": "failed",  // ⭐ Computed from workflows!
      "workflowSummary": {
        "total": 2,
        "failed": 1,
        "success": 1,
        "running": 0
      }
    },
    {
      "number": 41,
      "status": "success",  // ✅ All workflows passed
      "workflowSummary": {
        "total": 2,
        "failed": 0,
        "success": 2,
        "running": 0
      }
    }
  ]
}
```

**Frontend Display:**
```
Pipeline #42 ❌ FAILED (main branch)
  └─ 1/2 workflows failed

Pipeline #41 ✅ SUCCESS (main branch)
  └─ All workflows passed
```

---

### Step 2: Get Pipeline Details (Show What Failed)

```bash
GET /api/pipeline-details?slug=gh/owner/repo&pipeline=42
```

**Response:**
```json
{
  "message": "Pipeline details retrieved successfully",
  "details": {
    "pipeline": {
      "id": "abc-123",
      "number": 42,
      "status": "failed",
      "created_at": "2025-10-21T..."
    },
    "workflows": [
      {
        "id": "workflow-1",
        "name": "test",
        "status": "failed",
        "summary": {
          "total": 3,
          "failed": 1,
          "success": 2,
          "running": 0
        },
        "failedJobs": [
          {
            "id": "job-123",
            "name": "test-core",
            "job_number": 456
          }
        ]
      }
    ],
    "summary": {
      "totalWorkflows": 2,
      "totalJobs": 5,
      "failedJobs": 1
    },
    "failedJobs": [
      {
        "id": "job-123",
        "name": "test-core",
        "job_number": 456,
        "buildNumber": 42
      }
    ]
  }
}
```

**Frontend Display:**
```
Pipeline #42 Details

Workflow: test ❌
├─ test-core ❌ FAILED
├─ test-web ✅ SUCCESS
└─ test-cli ✅ SUCCESS

Workflow: build ✅
├─ build-core ✅ SUCCESS
└─ build-web ✅ SUCCESS

Summary: 1 failed job in 2 workflows
```

---

### Step 3: Get Test Failures

```bash
GET /api/failures?slug=gh/owner/repo&build=42
```

**Response:**
```json
{
  "message": "Test failures retrieved successfully",
  "count": 5,
  "failures": [
    {
      "testName": "should calculate total correctly",
      "testFile": "src/calculator.test.ts",
      "errorMessage": "Expected 5 but got 4",
      "stackTrace": "at Object.test (calculator.test.ts:10:5)",
      "jobId": "job-123",
      "buildNumber": 42
    }
  ]
}
```

**Frontend Display:**
```
Test Failures (5 total)

❌ src/calculator.test.ts
   should calculate total correctly
   Expected 5 but got 4

❌ src/utils.test.ts
   should format date correctly
   ...
```

---

### Step 4: Analyze Failures

```bash
GET /api/analyze?slug=gh/owner/repo&build=42
```

**Response:**
```json
{
  "message": "Test failures analyzed successfully",
  "count": 5,
  "analyzed": [
    {
      "testName": "should calculate total correctly",
      "testFile": "src/calculator.test.ts",
      "failureType": "ASSERTION",
      "confidence": 0.95,
      "suggestedFix": "Update expected value from 4 to 5"
    }
  ]
}
```

**Frontend Display:**
```
Analysis Results

📊 Failure Types:
  • ASSERTION: 3 tests
  • SNAPSHOT: 1 test
  • MOCK: 1 test

✅ High Confidence Fixes: 4/5
⚠️  Needs Review: 1/5
```

---

### Step 5: Generate Fixes (Preview)

```bash
POST /api/generate-fixes
Body: { "slug": "gh/owner/repo", "build": 42 }
```

**Response:**
```json
{
  "message": "Fix proposal generated successfully",
  "proposal": {
    "fixes": [
      {
        "testFile": "src/calculator.test.ts",
        "originalCode": "expect(result).toBe(4)",
        "fixedCode": "expect(result).toBe(5)",
        "explanation": "Updated expected value based on actual result",
        "confidence": 0.95
      }
    ],
    "summary": {
      "totalFixes": 5,
      "highConfidence": 4,
      "needsReview": 1
    }
  }
}
```

**Frontend Display:**
```
Proposed Fixes (5 total)

High Confidence (4):
✅ calculator.test.ts - Update assertion value
✅ utils.test.ts - Update snapshot
✅ api.test.ts - Fix mock expectation
✅ format.test.ts - Update date format

Needs Review (1):
⚠️  complex.test.ts - Multiple assertion changes

[Preview Code] [Apply All] [Review Individual]
```

---

### Step 6: Create PR

```bash
POST /api/fix
Body: { "slug": "gh/owner/repo", "build": 42 }
```

**Response:**
```json
{
  "message": "Operation Successful",
  "result": {
    "url": "https://github.com/owner/repo/pull/123",
    "number": 123,
    "title": "Fix: Automated test fixes for build #42"
  }
}
```

**Frontend Display:**
```
✅ Pull Request Created!

PR #123: Fix: Automated test fixes for build #42
Fixed 5 test failures

[View PR on GitHub]
```

---

## Key Differences from Original Design

### ❌ What DOESN'T Work:
```bash
# Pipelines don't have direct status in the API
GET /api/failures/gh/owner/repo/42  # Slug has slashes - breaks routing!
```

### ✅ What WORKS:
```bash
# 1. Fetch workflows to determine pipeline status
GET /api/pipelines?slug=gh/owner/repo

# 2. Each pipeline includes computed status from workflows
{
  "number": 42,
  "status": "failed",  // Computed!
  "workflowSummary": { ... }
}
```

---

## Frontend Component Suggestions

### PipelineList Component
```typescript
// Show list of pipelines with status badges
pipelines.map(p => (
  <PipelineCard
    number={p.number}
    status={p.status}  // 'failed', 'success', 'running'
    branch={p.vcs.branch}
    workflowSummary={p.workflowSummary}
    onClick={() => showDetails(p.number)}
  />
))
```

### PipelineDetails Component
```typescript
// Show workflow breakdown
details.workflows.map(w => (
  <WorkflowCard
    name={w.name}
    status={w.status}
    summary={w.summary}
    failedJobs={w.failedJobs}
  />
))
```

### FailuresList Component
```typescript
// Show test failures
failures.map(f => (
  <TestFailureCard
    testName={f.testName}
    testFile={f.testFile}
    errorMessage={f.errorMessage}
  />
))
```

---

## Complete Frontend User Journey

1. **Dashboard**: User sees all pipelines with status indicators
2. **Click Failed Pipeline**: Expands to show which workflows/jobs failed
3. **View Failures**: Shows specific test failures with error messages
4. **Analyze**: AI categorizes failures and suggests fix types
5. **Preview Fixes**: User reviews proposed code changes
6. **Apply**: One-click to create PR with all fixes

---

## Performance Notes

- `GET /api/pipelines` makes multiple API calls (1 + N workflows) but returns enriched data
- Frontend can cache pipeline list and refresh periodically
- Use `limit` parameter to control how many pipelines to fetch
- Failed pipelines are clearly marked in the response

---

## Example Frontend Code

```typescript
// 1. Fetch pipelines
const response = await fetch('/api/pipelines?slug=gh/owner/repo&limit=20');
const { pipelines } = await response.json();

// 2. Filter failed ones
const failed = pipelines.filter(p => p.status === 'failed');

// 3. Show details for a failed pipeline
const details = await fetch(`/api/pipeline-details?slug=gh/owner/repo&pipeline=${failed[0].number}`);

// 4. Get test failures
const failures = await fetch(`/api/failures?slug=gh/owner/repo&build=${failed[0].number}`);

// 5. One-click fix
const result = await fetch('/api/fix', {
  method: 'POST',
  body: JSON.stringify({ slug: 'gh/owner/repo', build: failed[0].number })
});
```

---

This flow gives your frontend everything it needs to build a great UX! 🎉
