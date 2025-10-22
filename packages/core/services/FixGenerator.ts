import { AnalyzedFailure, FixResult, FixProposal } from '../models';
import { IFixStrategy } from '../strategies/IFixStrategy';

/**
 * Configuration for fix generation
 */
export interface FixGeneratorConfig {
  maxConfidenceThreshold?: number; // Don't fix if confidence below this
  aiModel?: string;
}

/**
 * Orchestrates the fix generation process using appropriate strategies
 */
export class FixGenerator {
  private strategies: Map<string, IFixStrategy> = new Map();
  private config: FixGeneratorConfig;

  constructor(config: FixGeneratorConfig = {}) {
    this.config = {
      maxConfidenceThreshold: 0.5,
      aiModel: 'gpt-4',
      ...config
    };
  }

  /**
   * Registers a fix strategy for a specific failure type
   */
  registerStrategy(failureType: string, strategy: IFixStrategy): void {
    this.strategies.set(failureType, strategy);
  }

  /**
   * Generates a fix for a single analyzed failure
   */
  async generateFix(
    failure: AnalyzedFailure,
    testFileContent: string,
    codeDiff?: string
  ): Promise<FixResult> {
    const strategy = this.strategies.get(failure.failureType);

    if (!strategy) {
      return {
        originalCode: '',
        fixedCode: '',
        filePath: failure.testFile,
        strategy: 'none',
        explanation: `No strategy available for ${failure.failureType}`,
        confidence: 0,
        success: false,
        validationErrors: ['No strategy found']
      };
    }

    // Check confidence threshold
    if (failure.confidence < (this.config.maxConfidenceThreshold || 0.5)) {
      return {
        originalCode: '',
        fixedCode: '',
        filePath: failure.testFile,
        strategy: strategy.name,
        explanation: 'Confidence too low for automatic fix',
        confidence: failure.confidence,
        success: false,
        validationErrors: ['Low confidence']
      };
    }

    return await strategy.generateFix(failure, testFileContent, codeDiff);
  }

  /**
   * Generates fixes for multiple failures and creates a proposal
   */
  async generateProposal(
    failures: AnalyzedFailure[],
    testFileContents: Map<string, string>,
    codeDiff?: string
  ): Promise<FixProposal> {
    const fixes: FixResult[] = [];

    for (const failure of failures) {
      const content = testFileContents.get(failure.testFile) || '';
      const fix = await this.generateFix(failure, content, codeDiff);
      fixes.push(fix);
    }

    const successfulFixes = fixes.filter(f => f.success);
    const totalConfidence = successfulFixes.length > 0
      ? successfulFixes.reduce((sum, f) => sum + f.confidence, 0) / successfulFixes.length
      : 0;

    return {
      buildNumber: failures[0]?.buildNumber || 0,
      commitSha: failures[0]?.commitSha || '',
      branch: failures[0]?.branch,
      fixes,
      totalConfidence,
      estimatedTimesSaved: successfulFixes.length * 15 // Assume 15 min per fix
    };
  }
}
