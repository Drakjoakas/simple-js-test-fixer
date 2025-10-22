import { AnalyzedFailure, FixResult, FailureType } from '../models';
import { IFixStrategy } from './IFixStrategy';
import { OpenAIClient } from '../integrations/OpenAIClient';

/**
 * Strategy for fixing assertion failures
 * Uses AI to understand what changed and update expectations
 * Falls back to simple string replacement for basic cases
 */
export class AssertionFixStrategy implements IFixStrategy {
  readonly name = 'assertion';
  private aiClient: OpenAIClient;

  constructor(aiClient: OpenAIClient) {
    this.aiClient = aiClient;
  }

  canHandle(failure: AnalyzedFailure): boolean {
    return failure.failureType === FailureType.ASSERTION;
  }

  async generateFix(
    failure: AnalyzedFailure,
    testFileContent: string,
    codeDiff?: string
  ): Promise<FixResult> {
    // Extract expected vs received from error message
    const assertionInfo = this.parseAssertionError(failure.errorMessage);

    if (!assertionInfo) {
      // If we can't parse the assertion, try using AI
      return this.useAIFix(failure, testFileContent, codeDiff);
    }

    // Try simple string replacement for straightforward cases
    const simpleFix = this.applySimpleFix(
      testFileContent,
      assertionInfo.expected,
      assertionInfo.received
    );

    // If simple fix worked, use it with high confidence
    if (simpleFix !== testFileContent) {
      const explanation = `Updated assertion: expected "${assertionInfo.received}" instead of "${assertionInfo.expected}"`;

      return {
        originalCode: testFileContent,
        fixedCode: simpleFix,
        filePath: failure.testFile,
        strategy: this.name,
        explanation,
        confidence: 0.85,
        success: true
      };
    }

    // If simple fix didn't work, use AI for more complex cases
    return this.useAIFix(failure, testFileContent, codeDiff);
  }

  private async useAIFix(
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
        strategy: `${this.name}-ai`,
        explanation: result.explanation || 'AI-generated assertion fix',
        confidence: 0.7,
        success: true,
        aiModel: 'gpt-4',
        tokensUsed: result.tokensUsed
      };
    } catch (error) {
      return {
        originalCode: testFileContent,
        fixedCode: testFileContent,
        filePath: failure.testFile,
        strategy: this.name,
        explanation: `Failed to generate fix: ${(error as Error).message}`,
        confidence: 0,
        success: false,
        validationErrors: [`AI fix failed: ${(error as Error).message}`]
      };
    }
  }

  private parseAssertionError(errorMessage: string): { expected: string; received: string } | null {
    // Match patterns like "Expected: X, Received: Y" or "Expected X but got Y"
    const patterns = [
      /expected[:\s]+['"]?([^'"]+)['"]?.*received[:\s]+['"]?([^'"]+)['"]?/i,
      /expected[:\s]+['"]?([^'"]+)['"]?.*but got[:\s]+['"]?([^'"]+)['"]?/i,
      /Expected:\s*([^\n]+)\s*Received:\s*([^\n]+)/i
    ];

    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match) {
        return {
          expected: match[1].trim(),
          received: match[2].trim()
        };
      }
    }

    return null;
  }

  private applySimpleFix(code: string, expected: string, received: string): string {
    // Simple replacement - in production would use AST parsing
    return code.replace(
      new RegExp(`(['"\`])${this.escapeRegex(expected)}\\1`, 'g'),
      `$1${received}$1`
    );
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
