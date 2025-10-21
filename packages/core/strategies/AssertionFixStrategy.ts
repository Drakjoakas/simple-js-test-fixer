import { AnalyzedFailure, FixResult, FailureType } from '../models';
import { IFixStrategy } from './IFixStrategy';

/**
 * Strategy for fixing assertion failures
 * Uses AI to understand what changed and update expectations
 */
export class AssertionFixStrategy implements IFixStrategy {
  readonly name = 'assertion';
  private aiClient: any; // Will be injected - OpenAI client

  constructor(aiClient?: any) {
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
      return {
        originalCode: testFileContent,
        fixedCode: testFileContent,
        filePath: failure.testFile,
        strategy: this.name,
        explanation: 'Could not parse assertion error',
        confidence: 0,
        success: false,
        validationErrors: ['Unable to parse assertion']
      };
    }

    // For now, simple string replacement
    // In production, would use AI to understand context
    const fixedCode = this.applySimpleFix(
      testFileContent,
      assertionInfo.expected,
      assertionInfo.received
    );

    const explanation = `Updated assertion: expected "${assertionInfo.received}" instead of "${assertionInfo.expected}"`;

    return {
      originalCode: testFileContent,
      fixedCode,
      filePath: failure.testFile,
      strategy: this.name,
      explanation,
      confidence: 0.7,
      success: fixedCode !== testFileContent
    };
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
