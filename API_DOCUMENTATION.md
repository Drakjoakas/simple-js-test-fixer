# API Documentation

Base URL: `http://localhost:3000/api`

---

## Health Check

### GET /health
Check if the API is running.

**Request:**
```bash
curl http://localhost:3000/health
```

**Response:**
```
ok
```

---

## Frontend Discovery Endpoints

These endpoints help you discover projects and pipelines to work with.

### 1. GET /api/projects
Get all CircleCI projects for the authenticated user.

**Request:**
```bash
curl http://localhost:3000/api/projects
```

**Response:**
```json
{
  "message": "Projects retrieved successfully",
  "count": 5,
  "projects": [
    {
      "id": "project-id",
      "name": "my-project",
      "vcs_url": "https://github.com/owner/repo"
    }
  ]
}
```

---

### 2. GET /api/pipelines
Get recent pipelines for a project with their status.

**Parameters:**
- `slug` (required): Project slug in format `gh/owner/repo`
- `limit` (optional): Number of pipelines to fetch (default: 20)

**Request:**
```bash
curl "http://localhost:3000/api/pipelines?slug=gh/Drakjoakas/simple-js-test-fixer&limit=20"
```

**Response:**
```json
{
  "message": "Pipelines retrieved successfully",
  "count": 20,
  "pipelines": [
    {
      "id": "abc-123-def-456",
      "number": 42,
      "created_at": "2025-10-21T20:30:00Z",
      "vcs": {
        "branch": "main",
        "revision": "abc123def456"
      },
      "status": "failed",
      "workflowSummary": {
        "total": 2,
        "failed": 1,
        "success": 1,
        "running": 0
      }
    }
  ]
}
```

**Status values:**
- `success` - All workflows passed
- `failed` - At least one workflow failed
- `running` - At least one workflow is still running
- `unknown` - Unable to determine status

---

### 3. GET /api/pipeline-details
Get detailed information about a specific pipeline, including workflows and jobs.

**Parameters:**
- `slug` (required): Project slug in format `gh/owner/repo`
- `pipeline` (required): Pipeline number

**Request:**
```bash
curl "http://localhost:3000/api/pipeline-details?slug=gh/Drakjoakas/simple-js-test-fixer&pipeline=42"
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
      "created_at": "2025-10-21T20:30:00Z",
      "vcs": {
        "branch": "main",
        "revision": "abc123"
      }
    },
    "workflows": [
      {
        "id": "workflow-1",
        "name": "test",
        "status": "failed",
        "created_at": "2025-10-21T20:30:00Z",
        "stopped_at": "2025-10-21T20:35:00Z",
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
            "job_number": 456,
            "started_at": "2025-10-21T20:31:00Z"
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

---

## Test Analysis Endpoints

These endpoints help you understand and fix test failures.

### 4. GET /api/failures/:pipelineId
Get test failures from CircleCI for a specific pipeline.

**Parameters:**
- `pipelineId` (required, path): Pipeline ID from CircleCI

**Request:**
```bash
curl "http://localhost:3000/api/failures/abc-123-def-456"
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
      "buildNumber": 42,
      "commitSha": "abc123",
      "timestamp": "2025-10-21T20:35:00.000Z",
      "runner": "jest"
    }
  ]
}
```

---

### 5. GET /api/analyze/:pipelineId
Analyze test failures and categorize them by type.

**Parameters:**
- `pipelineId` (required, path): Pipeline ID from CircleCI

**Request:**
```bash
curl "http://localhost:3000/api/analyze/abc-123-def-456"
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
      "errorMessage": "Expected 5 but got 4",
      "stackTrace": "at Object.test (calculator.test.ts:10:5)",
      "failureType": "ASSERTION",
      "confidence": 0.95,
      "suggestedFix": "Update expected value",
      "commitSha": "abc123"
    }
  ]
}
```

**Failure Types:**
- `SNAPSHOT` - Snapshot mismatch
- `ASSERTION` - Assertion failure (expect statements)
- `MOCK` - Mock/spy issues
- `PROPERTY_CHANGE` - Object property changes
- `TYPE_ERROR` - TypeScript/type errors
- `UNKNOWN` - Unable to categorize

---

### 6. POST /api/generate-fixes
Generate fix proposals for test failures.

**Request Body:**
- `pipelineId` (required): Pipeline ID from CircleCI
- `slug` (required): Project slug in format `gh/owner/repo`

**Request:**
```bash
curl -X POST http://localhost:3000/api/generate-fixes \
  -H "Content-Type: application/json" \
  -d '{
    "pipelineId": "abc-123-def-456",
    "slug": "gh/Drakjoakas/simple-js-test-fixer"
  }'
```

**Response:**
```json
{
  "message": "Fix proposal generated successfully",
  "proposal": {
    "fixes": [
      {
        "testFile": "src/calculator.test.ts",
        "originalCode": "expect(result).toBe(4);",
        "fixedCode": "expect(result).toBe(5);",
        "explanation": "Updated expected value based on actual result",
        "confidence": 0.95,
        "failureType": "ASSERTION"
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

---

## Fix and PR Creation Endpoints

### 7. POST /api/create-pr
Create a pull request from a fix proposal.

**Request Body:**
- `proposal` (required): Fix proposal object from `/api/generate-fixes`

**Request:**
```bash
curl -X POST http://localhost:3000/api/create-pr \
  -H "Content-Type: application/json" \
  -d '{
    "proposal": {
      "fixes": [...],
      "summary": {...}
    }
  }'
```

**Response:**
```json
{
  "message": "Pull request created successfully",
  "pr": {
    "url": "https://github.com/owner/repo/pull/123",
    "number": 123,
    "title": "Fix: Automated test fixes for build #42",
    "state": "open"
  }
}
```

---

### 8. POST /api/fix/:pipelineId
**🚀 End-to-end workflow** - Fetch failures, analyze, generate fixes, and create PR in one call.

**Parameters:**
- `pipelineId` (required, path): Pipeline ID from CircleCI

**Request:**
```bash
curl -X POST "http://localhost:3000/api/fix/abc-123-def-456"
```

**Response:**
```json
{
  "message": "Operation Successful",
  "result": {
    "url": "https://github.com/owner/repo/pull/123",
    "number": 123,
    "title": "Fix: Automated test fixes for build #42",
    "state": "open",
    "fixes": [
      {
        "testFile": "src/calculator.test.ts",
        "explanation": "Updated expected value"
      }
    ]
  }
}
```

---

## Error Responses

All endpoints return errors in the following format:

**400 Bad Request:**
```json
{
  "message": "Bad Request: Missing slug or build from query parameters"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Error while fetching pipelines",
  "error": "CircleCI API error: 404 Project not found"
}
```

Note: In production (`NODE_ENV=production`), error details are hidden and return `"Internal server error"` instead.

---

## Usage Examples

### Example 1: Simple Workflow - One-Click Fix

```bash
# First, get the pipeline ID from the pipelines list
curl "http://localhost:3000/api/pipelines?slug=gh/Drakjoakas/simple-js-test-fixer"

# Then fix everything automatically using the pipeline ID
curl -X POST "http://localhost:3000/api/fix/abc-123-def-456"
```

---

### Example 2: Step-by-Step Workflow with Review

```bash
# Step 1: Get failed pipelines
curl "http://localhost:3000/api/pipelines?slug=gh/Drakjoakas/simple-js-test-fixer"
# Response includes pipeline IDs and their status

# Step 2: Get details about a failed pipeline (using pipeline number)
curl "http://localhost:3000/api/pipeline-details?slug=gh/Drakjoakas/simple-js-test-fixer&pipeline=42"
# Response includes the pipeline ID: "abc-123-def-456"

# Step 3: Get test failures (using pipeline ID)
curl "http://localhost:3000/api/failures/abc-123-def-456"

# Step 4: Analyze failures (using pipeline ID)
curl "http://localhost:3000/api/analyze/abc-123-def-456"

# Step 5: Generate fixes (review them)
curl -X POST http://localhost:3000/api/generate-fixes \
  -H "Content-Type: application/json" \
  -d '{
    "pipelineId": "abc-123-def-456",
    "slug": "gh/Drakjoakas/simple-js-test-fixer"
  }'

# Step 6: Create PR (after reviewing fixes)
curl -X POST "http://localhost:3000/api/fix/abc-123-def-456"
```

---

### Example 3: Frontend Discovery Flow

```javascript
// 1. List all projects
const projectsRes = await fetch('/api/projects');
const { projects } = await projectsRes.json();

// 2. User selects a project
const selectedSlug = 'gh/Drakjoakas/simple-js-test-fixer';

// 3. Get recent pipelines for that project
const pipelinesRes = await fetch(`/api/pipelines?slug=${selectedSlug}&limit=20`);
const { pipelines } = await pipelinesRes.json();

// 4. Filter failed pipelines
const failedPipelines = pipelines.filter(p => p.status === 'failed');

// 5. User clicks on a failed pipeline
const selectedPipeline = failedPipelines[0];
const pipelineId = selectedPipeline.id; // e.g., "abc-123-def-456"
const pipelineNumber = selectedPipeline.number; // e.g., 42

// 6. Get pipeline details (using pipeline number)
const detailsRes = await fetch(`/api/pipeline-details?slug=${selectedSlug}&pipeline=${pipelineNumber}`);
const { details } = await detailsRes.json();

// 7. Show failed jobs
console.log('Failed jobs:', details.failedJobs);

// 8. Get test failures (using pipeline ID)
const failuresRes = await fetch(`/api/failures/${pipelineId}`);
const { failures } = await failuresRes.json();

// 9. One-click fix (using pipeline ID)
const fixRes = await fetch(`/api/fix/${pipelineId}`, {
  method: 'POST'
});
const { result } = await fixRes.json();

console.log('PR created:', result.url);
```

---

## Rate Limiting

The API makes multiple calls to CircleCI and OpenAI APIs. Be mindful of:
- **CircleCI**: Rate limits vary by plan
- **OpenAI**: Costs per token usage (GPT-4 by default)
- **GitHub**: 5,000 requests per hour for authenticated users

---

## Authentication

Authentication is handled server-side via environment variables:
- `CIRCLE_CI_TOKEN` - CircleCI personal API token
- `GITHUB_TOKEN` - GitHub personal access token
- `OPENAI_TOKEN` - OpenAI API key

Clients don't need to provide credentials - the API uses the configured tokens.

---

## Environment Configuration

Required environment variables in `packages/web/.env`:

```bash
# Server
PORT=3000
NODE_ENV=development

# API Tokens
CIRCLE_CI_TOKEN=your_circleci_token
GITHUB_TOKEN=your_github_token
OPENAI_TOKEN=your_openai_token

# GitHub Repo (for PR creation)
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo-name
```

---

## Starting the Server

```bash
# Install dependencies
npm install

# Start the web server
npm run dev:web

# Server will be available at http://localhost:3000
```

---

## Notes

1. **Slug Format**: Always use `gh/owner/repo` format for GitHub projects
2. **Pipeline ID vs Number**:
   - **Pipeline ID** (e.g., `abc-123-def-456`): Unique UUID from CircleCI, used in most API calls
   - **Pipeline Number** (e.g., `42`): Sequential number shown in CircleCI UI, used for pipeline details
3. **Getting Pipeline IDs**: Use `/api/pipelines` to get the list with IDs, then use those IDs in subsequent calls
4. **Workflow Status**: Pipelines don't have direct status - it's computed from workflows
5. **OpenAI Model**: Defaults to `gpt-4` (can be changed via `OPENAI_MODEL` env var)
6. **Query Parameters**: Remember to URL-encode query parameters in production

---

## Support

For issues or questions:
- Check logs in the console
- Verify environment variables are set correctly
- Use the token test script: `npx tsx test-tokens.ts`
- Review [API_FLOW_GUIDE.md](API_FLOW_GUIDE.md) for detailed flow examples

---

Happy testing! 🚀
