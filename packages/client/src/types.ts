// API Response Types based on API_DOCUMENTATION.md

export interface Pipeline {
  id: string;
  number: number;
  project_slug: string;
  created_at: string;
  updated_at: string;
  state: string;
  trigger_parameters?: {
    git?: {
      branch?: string;
      commit_sha?: string;
      repo_name?: string;
    };
    github_app?: {
      branch?: string;
      commit_sha?: string;
      repo_name?: string;
    };
  };
  status: 'success' | 'failed' | 'running' | 'unknown';
  workflowSummary: {
    total: number;
    failed: number;
    success: number;
    running: number;
  };
}

export interface Job {
  id: string;
  name: string;
  job_number: number;
  started_at?: string;
}

export interface Workflow {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'running';
  created_at: string;
  stopped_at?: string;
  summary: {
    total: number;
    failed: number;
    success: number;
    running: number;
  };
  failedJobs: Job[];
}

export interface PipelineDetails {
  pipeline: Omit<Pipeline, 'workflowSummary'> & {
    vcs?: {
      branch?: string;
      revision?: string;
    };
  };
  workflows: Workflow[];
  summary: {
    totalWorkflows: number;
    totalJobs: number;
    failedJobs: number;
  };
  failedJobs: Array<Job & { buildNumber: number }>;
}

export interface TestFailure {
  testName: string;
  testFile: string;
  errorMessage: string;
  stackTrace: string;
  jobId: string;
  buildNumber: number;
  commitSha: string;
  timestamp: string;
  runner: string;
}

export interface AnalyzedFailure extends TestFailure {
  failureType: 'SNAPSHOT' | 'ASSERTION' | 'MOCK' | 'PROPERTY_CHANGE' | 'TYPE_ERROR' | 'UNKNOWN';
  confidence: number;
  suggestedFix: string;
}

export interface Fix {
  filePath: string;
  originalCode: string;
  fixedCode: string;
  explanation: string;
  confidence: number;
  strategy?: string;
  success?: boolean;
  aiModel?: string;
  tokensUsed?: number;
}

export interface FixProposal {
  buildNumber: number;
  commitSha: string;
  branch: string;
  fixes: Fix[];
  totalConfidence: number;
  estimatedTimesSaved: number;
}

export interface PullRequest {
  url: string;
  number: number;
  title: string;
  state: string;
  fixes?: Array<{ testFile: string; explanation: string }>;
}

// API Response wrappers
export interface PipelinesResponse {
  message: string;
  count: number;
  pipelines: Pipeline[];
}

export interface PipelineDetailsResponse {
  message: string;
  details: PipelineDetails;
}

export interface FailuresResponse {
  message: string;
  count: number;
  failures: TestFailure[];
}

export interface AnalysisResponse {
  message: string;
  count: number;
  analyzed: AnalyzedFailure[];
}

export interface GenerateFixesResponse {
  message: string;
  proposal: FixProposal;
}

export interface FixResponse {
  message: string;
  result: PullRequest;
}
