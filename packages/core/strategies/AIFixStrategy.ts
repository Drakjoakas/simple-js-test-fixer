import { AnalyzedFailure, FixResult, FailureType } from '../models';
import { IFixStrategy } from './IFixStrategy';
import { OpenAIClient } from '../integrations/OpenAIClient';

/**
 * Fallback strategy that uses AI for complex fixes
 * Handles mocks, property changes, and unknown failures
 */
export class AIFixStrategy implements IFixStrategy {
  readonly name = 'ai-powered';
  private aiClient: OpenAIClient;

  constructor(aiClient: OpenAIClient) {
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
    try {
      const result = await this.aiClient.generateTestFix(
        testFileContent,
        failure.errorMessage,
        failure.stackTrace || '',
        codeDiff
      );

      return {
        originalCode: testFileContent,
        fixedCode: result.fixedCode,
        filePath: failure.testFile,
        strategy: this.name,
        explanation: result.explanation || this.generateExplanation(failure),
        confidence: this.calculateConfidence(failure),
        success: true,
        aiModel: 'gpt-4',
        tokensUsed: result.tokensUsed
      };
    } catch (error) {
      return this.createFailureResult(
        failure,
        `AI fix failed: ${(error as Error).message}`
      );
    }
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
