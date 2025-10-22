import { TestAnalyzer, FixGenerator, PRCreator } from './services';
import { CircleCIClient, GitHubClient, OpenAIClient } from './integrations';
import {
  SnapshotFixStrategy,
  AssertionFixStrategy,
  AIFixStrategy
} from './strategies';
import {
  TestFailure,
  AnalyzedFailure,
  FixProposal,
  CreatedPR,
  FailureType
} from './models';

/**
 * Configuration for the TestFixer orchestrator
 */
export interface TestFixerConfig {
  circleci: {
    apiToken: string;
  };
  github: {
    token: string;
    owner: string;
    repo: string;
  };
  openai: {
    apiKey: string;
    model?: string;
  };
  fixConfidenceThreshold?: number;
}

/**
 * Main orchestrator that coordinates the entire test fixing workflow
 * This is the primary interface for both CLI and web applications
 */
export class TestFixerOrchestrator {
  private analyzer: TestAnalyzer;
  private generator: FixGenerator;
  private prCreator: PRCreator;

  private circleci: CircleCIClient;
  private github: GitHubClient;
  private openai: OpenAIClient;

  private config: TestFixerConfig;

  constructor(config: TestFixerConfig) {
    this.config = config;

    // Initialize clients
    this.circleci = new CircleCIClient({ apiToken: config.circleci.apiToken });
    this.github = new GitHubClient({ token: config.github.token });
    this.openai = new OpenAIClient({
      apiKey: config.openai.apiKey,
      model: config.openai.model
    });

    // Initialize services
    this.analyzer = new TestAnalyzer();
    this.generator = new FixGenerator({
      maxConfidenceThreshold: config.fixConfidenceThreshold,
      aiModel: config.openai.model
    });
    this.prCreator = new PRCreator();

    // Register fix strategies
    this.setupStrategies();
  }

  /**
   * Main workflow: Fetch failures, analyze, fix, and create PR
   */
  async fixFailuresAndCreatePR(
    pipelineId: string
  ): Promise<CreatedPR> {
    // Step 1: Fetch test failures from CircleCI
    const failures = await this.fetchTestFailures(pipelineId);

    if (failures.length === 0) {
      throw new Error('No test failures found for this build');
    }

    // Step 2: Analyze failures
    const analyzed = await this.analyzer.analyzeMany(failures);

    // Step 3: Fetch context (test files and code diff)
    const context = await this.gatherContext(analyzed);

    // Step 4: Generate fixes
    const proposal = await this.generator.generateProposal(
      analyzed,
      context.testFiles,
      context.codeDiff
    );

    // Step 5: Create PR
    const prData = this.prCreator.preparePRData(
      proposal,
      this.config.github.owner,
      this.config.github.repo,
      proposal.branch || 'main' // Target the branch that caused the failure, fallback to main
    );

    const pr = await this.github.createPullRequest(prData);

    return pr;
  }

  /**
   * Fetch test failures from CircleCI for a specific build
   */
  async fetchTestFailures(
    pipelineId: string
  ): Promise<TestFailure[]> {
    return this.circleci.getFailedTestOutput(pipelineId);
  }

  /**
   * Analyze test failures and categorize them
   */
  async analyzeFailures(failures: TestFailure[]): Promise<AnalyzedFailure[]> {
    return this.analyzer.analyzeMany(failures);
  }

  /**
   * Generate fixes for analyzed failures
   */
  async generateFixes(
    failures: AnalyzedFailure[],
    projectSlug: string
  ): Promise<FixProposal> {
    const context = await this.gatherContext(failures);
    return this.generator.generateProposal(
      failures,
      context.testFiles,
      context.codeDiff
    );
  }

  /**
   * Create a PR from a fix proposal
   */
  async createPR(proposal: FixProposal): Promise<CreatedPR> {
    const prData = this.prCreator.preparePRData(
      proposal,
      this.config.github.owner,
      this.config.github.repo,
      proposal.branch || 'main' // Target the branch that caused the failure, fallback to main
    );

    return this.github.createPullRequest(prData);
  }

  /**
   * Gathers context needed for fixing: test files and code diff
   */
  private async gatherContext(failures: AnalyzedFailure[]): Promise<{
    testFiles: Map<string, string>;
    codeDiff?: string;
  }> {
    const testFiles = new Map<string, string>();
    const commitSha = failures[0]?.commitSha;

    // Fetch all test files
    const uniqueFiles = [...new Set(failures.map(f => f.testFile).filter(f => f && f !== 'Unknown'))];

    if (uniqueFiles.length === 0) {
      console.warn('No valid test files found in failures. Cannot fetch file contents.');
      // Return empty map - strategies will need to work with error messages only
      return { testFiles, codeDiff: undefined };
    }

    for (const file of uniqueFiles) {
      try {
        // If commitSha is available, fetch from that commit
        // Otherwise, fetch from default branch
        const content = await this.github.getFileContent(
          this.config.github.owner,
          this.config.github.repo,
          file,
          commitSha || undefined
        );
        testFiles.set(file, content);
      } catch (error: any) {
        console.error(`Failed to fetch ${file}:`, error.message);
        // Add a placeholder so we know this file was attempted
        testFiles.set(file, `// Unable to fetch file content: ${error.message}`);
      }
    }

    // Fetch commit diff
    let codeDiff: string | undefined;
    if (commitSha) {
      try {
        codeDiff = await this.github.getCommitDiff(
          this.config.github.owner,
          this.config.github.repo,
          commitSha
        );
      } catch (error: any) {
        console.error('Failed to fetch commit diff:', error.message);
      }
    } else {
      console.warn('No commit SHA available - skipping diff fetch');
    }

    return { testFiles, codeDiff };
  }

  /**
   * Sets up the fix strategies
   */
  private setupStrategies(): void {
    // Register strategies for different failure types
    this.generator.registerStrategy(
      FailureType.SNAPSHOT,
      new SnapshotFixStrategy()
    );

    this.generator.registerStrategy(
      FailureType.ASSERTION,
      new AssertionFixStrategy(this.openai)
    );

    // AI strategy as fallback for complex cases
    this.generator.registerStrategy(
      FailureType.MOCK,
      new AIFixStrategy(this.openai)
    );

    this.generator.registerStrategy(
      FailureType.PROPERTY_CHANGE,
      new AIFixStrategy(this.openai)
    );

    this.generator.registerStrategy(
      FailureType.TYPE_ERROR,
      new AIFixStrategy(this.openai)
    );

    this.generator.registerStrategy(
      FailureType.UNKNOWN,
      new AIFixStrategy(this.openai)
    );
  }
}
