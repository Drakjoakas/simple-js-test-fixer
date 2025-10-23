import { TestFixerOrchestrator } from 'core';
import { TestFixerConfig } from 'core/TestFixerOrchestrator';
import { TestFailure, AnalyzedFailure, FixProposal, CreatedPR } from 'core';
import { CircleCIClient } from 'core';

export class MainService {
  private testFixerOrchestrator: TestFixerOrchestrator;
  private circleCIClient: CircleCIClient;
  private defaultSlug: string;

  constructor() {
    const config: TestFixerConfig = {
      circleci: { apiToken: process.env.CIRCLE_CI_TOKEN! },
      openai: { apiKey: process.env.OPENAI_TOKEN! },
      github: {
        token: process.env.GITHUB_TOKEN!,
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!
      }
    };
    this.testFixerOrchestrator = new TestFixerOrchestrator(config);
    this.circleCIClient = new CircleCIClient({ apiToken: process.env.CIRCLE_CI_TOKEN! });
    this.defaultSlug = process.env.CIRCLECI_ORG_SLUG || '';
  }

  /**
   * Get the default CircleCI org slug from environment
   */
  getDefaultSlug(): string {
    return this.defaultSlug;
  }

  /**
   * End-to-end workflow: Fetch failures, analyze, fix, and create PR
   */
  async fixAndCreatePR(pipelineId: string): Promise<CreatedPR> {
    return this.testFixerOrchestrator.fixFailuresAndCreatePR(pipelineId);
  }

  /**
   * Step 1: Fetch test failures from CircleCI
   * Use this to preview failures before deciding to fix them
   */
  async getTestFailures(pipelineId: string): Promise<TestFailure[]> {
    return this.testFixerOrchestrator.fetchTestFailures(pipelineId);
  }

  /**
   * Step 2: Analyze test failures and categorize them
   * Use this to understand what types of failures exist
   */
  async analyzeTestFailures(pipelineId: string): Promise<AnalyzedFailure[]> {
    const failures = await this.testFixerOrchestrator.fetchTestFailures(pipelineId);
    return this.testFixerOrchestrator.analyzeFailures(failures);
  }

  /**
   * Step 3: Generate fixes for analyzed failures
   * Use this to preview proposed fixes before creating a PR
   */
  async generateFixes(pipelineId: string, slug?: string): Promise<FixProposal> {
    const failures = await this.testFixerOrchestrator.fetchTestFailures(pipelineId);
    const analyzed = await this.testFixerOrchestrator.analyzeFailures(failures);
    const effectiveSlug = slug || this.defaultSlug;
    if (!effectiveSlug) {
      throw new Error('CircleCI org slug is required. Set CIRCLECI_ORG_SLUG environment variable or provide slug parameter.');
    }
    return this.testFixerOrchestrator.generateFixes(analyzed, effectiveSlug);
  }

  /**
   * Step 4: Create PR from a fix proposal
   * Use this after reviewing and approving a fix proposal
   */
  async createPRFromProposal(proposal: FixProposal): Promise<CreatedPR> {
    return this.testFixerOrchestrator.createPR(proposal);
  }

  /**
   * Frontend: Get all projects for the authenticated user
   * Use this to let users choose which project to work with
   */
  async getProjects(): Promise<any[]> {
    return this.circleCIClient.getProjects();
  }

  /**
   * Frontend: Get recent pipelines for a specific project
   * Use this to let users choose which pipeline/build has failures
   */
  async getPipelines(slug?: string, limit: number = 20): Promise<any[]> {
    const effectiveSlug = slug || this.defaultSlug;
    if (!effectiveSlug) {
      throw new Error('CircleCI org slug is required. Set CIRCLECI_ORG_SLUG environment variable or provide slug parameter.');
    }
    return this.circleCIClient.getRecentPipelines(effectiveSlug, limit);
  }

  /**
   * Frontend: Get detailed pipeline information with workflows and jobs
   * Use this to visualize the pipeline status and errors
   */
  async getPipelineDetails(slug?: string, pipelineNumber?: number): Promise<any> {
    const effectiveSlug = slug || this.defaultSlug;
    if (!effectiveSlug) {
      throw new Error('CircleCI org slug is required. Set CIRCLECI_ORG_SLUG environment variable or provide slug parameter.');
    }
    if (!pipelineNumber) {
      throw new Error('Pipeline number is required.');
    }
    return this.circleCIClient.getPipelineDetails(effectiveSlug, pipelineNumber);
  }
}
