import { TestFailure } from '../models';

/**
 * Configuration for CircleCI client
 */
export interface CircleCIConfig {
  apiToken: string;
  baseUrl?: string;
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
}

/**
 * Client for interacting with CircleCI API
 */
export class CircleCIClient {
  private apiToken: string;
  private baseUrl: string;

  constructor(config: CircleCIConfig) {
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl || 'https://circleci.com/api/v2';
  }

  /**
   * Fetches recent pipelines for a project
   */
  async getRecentPipelines(projectSlug: string): Promise<CircleCIPipeline[]> {
    const url = `${this.baseUrl}/project/${projectSlug}/pipeline`;
    const response = await this.fetch(url);
    return response.items || [];
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
