import { AnalyzedFailure, FixResult, FailureType } from '../models';
import { IFixStrategy } from './IFixStrategy';

/**
 * Fallback strategy that uses AI for complex fixes
 * Handles mocks, property changes, and unknown failures
 */
export class AIFixStrategy implements IFixStrategy {
  readonly name = 'ai-powered';
  private aiClient: any; // OpenAI client will be injected

  constructor(aiClient?: any) {
    this.aiClient = aiClient;
  }

  canHandle(failure: AnalyzedFailure): boolean {
    // Can handle any type, but should be used as fallback
    return true;
  }

  async generateFix(
    failure: AnalyzedFailure,
    testFileContent: string,
    codeDiff?: string
  ): Promise<FixResult> {
    if (!this.aiClient) {
      return this.createFailureResult(failure, 'AI client not configured');
    }

    try {
      const prompt = this.buildPrompt(failure, testFileContent, codeDiff);
      const fixedCode = await this.callAI(prompt);

      return {
        originalCode: testFileContent,
        fixedCode,
        filePath: failure.testFile,
        strategy: this.name,
        explanation: this.generateExplanation(failure),
        confidence: this.calculateConfidence(failure),
        success: true,
        aiModel: 'gpt-4'
      };
    } catch (error) {
      return this.createFailureResult(
        failure,
        `AI fix failed: ${(error as Error).message}`
      );
    }
  }

  private buildPrompt(
    failure: AnalyzedFailure,
    testFileContent: string,
    codeDiff?: string
  ): string {
    let prompt = `You are a test fixing assistant. Fix the following test failure:\n\n`;

    prompt += `## Test File: ${failure.testFile}\n`;
    prompt += `## Error: ${failure.errorMessage}\n\n`;
    prompt += `## Stack Trace:\n${failure.stackTrace}\n\n`;

    if (codeDiff) {
      prompt += `## Recent Code Changes:\n${codeDiff}\n\n`;
    }

    prompt += `## Current Test File:\n\`\`\`typescript\n${testFileContent}\n\`\`\`\n\n`;
    prompt += `Please provide the corrected test file. Only return the fixed code, no explanations.`;

    return prompt;
  }

  private async callAI(prompt: string): Promise<string> {
    // Placeholder - actual implementation will use OpenAI client
    // For now, return original (no-op)
    throw new Error('AI client not implemented yet - wire up OpenAI in integration layer');
  }

  private generateExplanation(failure: AnalyzedFailure): string {
    const typeMap: Record<string, string> = {
      [FailureType.MOCK]: 'Updated mock to match new implementation',
      [FailureType.PROPERTY_CHANGE]: 'Fixed property/method name changes',
      [FailureType.TYPE_ERROR]: 'Corrected TypeScript type definitions',
      [FailureType.UNKNOWN]: 'Applied AI-suggested fix based on error analysis'
    };

    return typeMap[failure.failureType] || 'Applied automated fix';
  }

  private calculateConfidence(failure: AnalyzedFailure): number {
    // Lower confidence for AI fixes since they need more validation
    return Math.min(failure.confidence * 0.8, 0.75);
  }

  private createFailureResult(failure: AnalyzedFailure, error: string): FixResult {
    return {
      originalCode: '',
      fixedCode: '',
      filePath: failure.testFile,
      strategy: this.name,
      explanation: error,
      confidence: 0,
      success: false,
      validationErrors: [error]
    };
  }
}
