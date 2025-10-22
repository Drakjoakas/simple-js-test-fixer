import { TestFailure } from '../models';

/**
 * Configuration for CircleCI client
 */
export interface CircleCIConfig {
  apiToken: string;
  baseUrl?: string;
  v1BaseUrl?:string;
}

/**
 * CircleCI API response types
 */
export interface CircleCIPipeline {
  id: string;
  project_slug: string;
  state: string;
  created_at: string;
  vcs: {
    revision: string;
    branch: string;
  };
}

export interface CircleCIJob {
  id: string;
  job_number: number;
  name: string;
  status: string;
  started_at: string;
  project_slug: string;
  pipeline_number: string;
}

export interface StepAction {
  index: number;
  name: string;
  status: string;
  output_url: string;
}

export interface Step {
  name: string;
  actions: Array<StepAction>
}

/**
 * Client for interacting with CircleCI API
 */
export class CircleCIClient {
  private apiToken: string;
  private baseUrl: string;
  private v1BaseUrl:string;

  constructor(config: CircleCIConfig) {
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl || 'https://circleci.com/api/v2';
    this.v1BaseUrl = config.v1BaseUrl || 'https://circleci.com/api/v1.1';
  }

  /**
   * Gets all projects for the authenticated user
   */
  async getProjects(): Promise<any[]> {
    // Get user's projects through their followed projects
    const projectsUrl = `${this.baseUrl}/me/collaborations`;
    const projectsResponse = await this.fetch(projectsUrl);
    return projectsResponse || [];
  }

  /**
   * Fetches recent pipelines for a project WITH their workflow statuses
   * This is the key method for the frontend - it shows which pipelines have failures
   */
  async getRecentPipelines(projectSlug: string, limit: number = 20): Promise<any[]> {
    const url = `${this.baseUrl}/pipeline?limit=${limit}&org-slug=${projectSlug}`;
    const response = await this.fetch(url);

    const pipelines = response.items || [];

    // For each pipeline, fetch its workflows to determine overall status
    const pipelinesWithStatus = await Promise.all(
      pipelines.map(async (pipeline: any) => {
        try {
          const workflowsUrl = `${this.baseUrl}/pipeline/${pipeline.id}/workflow`;
          const workflowsResponse = await this.fetch(workflowsUrl);
          const workflows = workflowsResponse.items || [];

          // Determine overall pipeline status based on workflows
          const hasFailedWorkflow = workflows.some((w: any) => w.status === 'failed');
          const hasRunningWorkflow = workflows.some((w: any) => w.status === 'running');
          const allSuccessful = workflows.every((w: any) => w.status === 'success');

          let overallStatus = 'unknown';
          if (hasFailedWorkflow) {
            overallStatus = 'failed';
          } else if (hasRunningWorkflow) {
            overallStatus = 'running';
          } else if (allSuccessful && workflows.length > 0) {
            overallStatus = 'success';
          }

          return {
            ...pipeline,
            status: overallStatus,
            workflowSummary: {
              total: workflows.length,
              failed: workflows.filter((w: any) => w.status === 'failed').length,
              success: workflows.filter((w: any) => w.status === 'success').length,
              running: workflows.filter((w: any) => w.status === 'running').length
            }
          };
        } catch (error) {
          console.error(`Error fetching workflows for pipeline ${pipeline.id}:`, error);
          return {
            ...pipeline,
            status: 'unknown',
            workflowSummary: { total: 0, failed: 0, success: 0, running: 0 }
          };
        }
      })
    );

    return pipelinesWithStatus;
  }

  /**
   * Gets detailed pipeline info with workflows and jobs
   * This provides deep dive into what failed - perfect for showing errors in the UI
   */
  async getPipelineDetails(projectSlug: string, pipelineNumber: number): Promise<any> {
    const pipelinesUrl = `${this.baseUrl}/project/${projectSlug}/job/${pipelineNumber}`;
    console.log(pipelinesUrl);
    const pipelinesResponse = await this.fetch(pipelinesUrl);

    console.log(pipelinesResponse);

    const { pipeline } = pipelinesResponse;

    // Get workflows for this pipeline
    const workflowsUrl = `${this.baseUrl}/pipeline/${pipeline.id}/workflow`;
    const workflowsResponse = await this.fetch(workflowsUrl);

    // Get jobs for each workflow with detailed status
    const workflows = await Promise.all(
      (workflowsResponse.items || []).map(async (workflow: any) => {
        const jobs = await this.getWorkflowJobs(workflow.id);

        // Separate jobs by status for easy frontend display
        const failedJobs = jobs.filter((j: any) => j.status === 'failed');
        const successJobs = jobs.filter((j: any) => j.status === 'success');
        const runningJobs = jobs.filter((j: any) => j.status === 'running');

        return {
          id: workflow.id,
          name: workflow.name,
          status: workflow.status,
          created_at: workflow.created_at,
          stopped_at: workflow.stopped_at,
          jobs: jobs,
          summary: {
            total: jobs.length,
            failed: failedJobs.length,
            success: successJobs.length,
            running: runningJobs.length
          },
          // Highlight failed jobs for easy access
          failedJobs: failedJobs.map((j: any) => ({
            id: j.id,
            name: j.name,
            job_number: j.job_number,
            started_at: j.started_at
          }))
        };
      })
    );

    // Determine overall status
    const hasFailedWorkflow = workflows.some((w: any) => w.status === 'failed');
    const hasRunningWorkflow = workflows.some((w: any) => w.status === 'running');
    const allSuccessful = workflows.every((w: any) => w.status === 'success');

    let overallStatus = 'unknown';
    if (hasFailedWorkflow) {
      overallStatus = 'failed';
    } else if (hasRunningWorkflow) {
      overallStatus = 'running';
    } else if (allSuccessful && workflows.length > 0) {
      overallStatus = 'success';
    }

    // Collect all failed jobs across all workflows for quick access
    const allFailedJobs = workflows
      .flatMap((w: any) => w.failedJobs)
      .map((j: any) => ({
        ...j,
        buildNumber: pipelineNumber // Include build number for fetching test results
      }));

    return {
      pipeline: {
        id: pipeline.id,
        number: pipeline.number,
        project_slug: pipeline.project_slug,
        status: overallStatus,
        created_at: pipeline.created_at,
        vcs: pipeline.vcs
      },
      workflows,
      summary: {
        totalWorkflows: workflows.length,
        totalJobs: workflows.reduce((sum: number, w: any) => sum + w.summary.total, 0),
        failedJobs: allFailedJobs.length
      },
      failedJobs: allFailedJobs // Quick access to all failures
    };
  }

  /**
   * Gets failed jobs for a specific pipeline
   */
  async getFailedJobs(pipelineId: string): Promise<CircleCIJob[]> {
    const url = `${this.baseUrl}/pipeline/${pipelineId}/workflow`;
    const workflows = await this.fetch(url);

    const allJobs: CircleCIJob[] = [];
    for (const workflow of workflows.items || []) {
      const jobs = await this.getWorkflowJobs(workflow.id);
      allJobs.push(...jobs.filter(job => job.status === 'failed'));
    }

    return allJobs;
  }

  /**
   * Fetches test results for a specific job
   */
  async getTestResults(jobNumber: number, projectSlug: string): Promise<TestFailure[]> {
    const url = `${this.baseUrl}/project/${projectSlug}/${jobNumber}/tests`;
    const response = await this.fetch(url);

    return this.parseTestResults(response.items || []);
  }

  async getFailedTestOutput(pipelineId: string): Promise<TestFailure[]> {
    const failedJobs = await this.getFailedJobs(pipelineId);
    const testFailures: TestFailure[] = [];

    // Get commit SHA and branch from one of the jobs (they all have the same commit)
    let commitSha = '';
    let branch = '';
    if (failedJobs.length > 0) {
      try {
        const firstJob = failedJobs[0];
        const jobDetailsUrl = `${this.v1BaseUrl}/project/${firstJob.project_slug}/${firstJob.job_number}`;
        const jobDetails = await this.fetch(jobDetailsUrl);
        commitSha = jobDetails.vcs_revision || '';
        branch = jobDetails.branch || '';
      } catch (error) {
        console.error('Failed to get commit SHA and branch:', error);
      }
    }

    for (const job of failedJobs) {
      const projectSlug = job.project_slug;
      const jobNumber = job.job_number;

      try {
        const errorOutput = await this.getPipelineErrorMessages(projectSlug, jobNumber);

        // Parse test file and test name from error output
        const parsedInfo = this.parseTestInfo(errorOutput);

        // Create a TestFailure object from the error output
        const testFailure: TestFailure = {
          testName: parsedInfo.testName || job.name || 'Unknown Test',
          testFile: parsedInfo.testFile || 'Unknown',
          errorMessage: errorOutput || 'No error message available',
          stackTrace: parsedInfo.stackTrace || '',
          jobId: job.id,
          buildNumber: typeof jobNumber === 'string' ? parseInt(jobNumber) : jobNumber,
          commitSha: commitSha,
          branch: branch,
          timestamp: new Date(job.started_at || Date.now()),
          runner: 'jest'
        };

        testFailures.push(testFailure);
      } catch (error) {
        console.error(`Failed to get error messages for job ${jobNumber}:`, error);
      }
    }

    return testFailures;
  }

  /**
   * Parses test information from error output
   */
  private parseTestInfo(errorOutput: string): {
    testFile?: string;
    testName?: string;
    stackTrace?: string;
  } {
    const lines = errorOutput.split('\n');
    let testFile: string | undefined;
    let testName: string | undefined;
    let stackTrace: string | undefined;

    // Look for "FAIL" line which contains the test file
    const failLine = lines.find(line => line.trim().startsWith('FAIL'));
    if (failLine) {
      const match = failLine.match(/FAIL\s+(.+\.spec\.[jt]sx?|.+\.test\.[jt]sx?)/);
      if (match) {
        testFile = match[1].trim();
      }
    }

    // Look for test name (usually after ●)
    const testNameLine = lines.find(line => line.includes('●'));
    if (testNameLine) {
      testName = testNameLine.replace(/●/g, '').trim();
    }

    // Extract stack trace (lines starting with "at" or containing file paths)
    const stackLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('at ') ||
             (trimmed.includes('.ts:') || trimmed.includes('.js:')) ||
             trimmed.match(/^\s+\d+\s+\|/); // Jest stack traces with line numbers
    });

    if (stackLines.length > 0) {
      stackTrace = stackLines.join('\n');
    }

    return { testFile, testName, stackTrace };
  }

  async getPipelineErrorMessages(projectSlug: string, build: string | number): Promise<string> {
    const url = `${this.v1BaseUrl}/project/${projectSlug}/${build}`;
    const job = await this.fetch(url);

    const testStep = job.steps.find((item: Step) => item.name === "Run tests");
    if (!testStep) {
      throw new Error('No "Run tests" step found in job');
    }

    const failedActions = testStep.actions.find((action: StepAction) => action.status === "failed");
    if (!failedActions) {
      throw new Error('No failed actions found in test step');
    }

    const errorOutput = await this.fetch(failedActions.output_url);

    // CircleCI returns an array of output objects
    // Each object has a 'message' field containing the log text
    if (Array.isArray(errorOutput)) {
      // Concatenate all messages into a single string
      return errorOutput
        .map((item: any) => item.message || '')
        .filter((msg: string) => msg.length > 0)
        .join('\n');
    }

    // Fallback: if it's already a string
    if (typeof errorOutput === 'string') {
      return errorOutput;
    }

    // Fallback: if it's an object with a message property
    if (errorOutput && typeof errorOutput === 'object' && 'message' in errorOutput) {
      return String(errorOutput.message);
    }

    return 'Unable to parse error output';
  }

  /**
   * Gets job logs to extract error details
   */
  async getJobLogs(jobNumber: number, projectSlug: string): Promise<string> {
    // Note: CircleCI v2 API doesn't directly expose logs
    // Would need to use v1.1 API or parse test metadata
    const url = `${this.baseUrl}/project/${projectSlug}/${jobNumber}`;
    const job = await this.fetch(url);

    // For now, return placeholder
    // In production, would fetch actual logs
    return `Job logs for ${jobNumber} (implementation pending)`;
  }

  /**
   * Helper to get jobs for a workflow
   */
  private async getWorkflowJobs(workflowId: string): Promise<CircleCIJob[]> {
    const url = `${this.baseUrl}/workflow/${workflowId}/job`;
    const response = await this.fetch(url);
    return response.items || [];
  }

  /**
   * Parses CircleCI test results into TestFailure objects
   */
  private parseTestResults(testItems: any[]): TestFailure[] {
    return testItems
      .filter(item => item.result === 'failure')
      .map(item => ({
        testName: item.name,
        testFile: item.file || item.classname,
        errorMessage: item.message || '',
        stackTrace: item.run_time ? `Runtime: ${item.run_time}ms` : '',
        jobId: '', // Set by caller
        buildNumber: 0, // Set by caller
        commitSha: '', // Set by caller
        timestamp: new Date(),
        runner: 'jest' as const
      }));
  }

  /**
   * Generic fetch helper with auth
   */
  private async fetch(url: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        'Circle-Token': this.apiToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`CircleCI API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}
