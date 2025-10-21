import { TestFailure, AnalyzedFailure, FailureType } from '../models';

/**
 * Analyzes test failures and categorizes them for appropriate fixing strategies
 */
export class TestAnalyzer {
  /**
   * Analyzes a raw test failure and determines its type
   */
  async analyze(failure: TestFailure): Promise<AnalyzedFailure> {
    const failureType = this.detectFailureType(failure);
    const confidence = this.calculateConfidence(failure, failureType);
    const affectedCode = this.extractAffectedCode(failure);

    return {
      ...failure,
      failureType,
      confidence,
      affectedCode
    };
  }

  /**
   * Analyzes multiple failures in batch
   */
  async analyzeMany(failures: TestFailure[]): Promise<AnalyzedFailure[]> {
    return Promise.all(failures.map(f => this.analyze(f)));
  }

  /**
   * Detects the type of failure based on error message and stack trace
   */
  private detectFailureType(failure: TestFailure): FailureType {
    const { errorMessage, stackTrace } = failure;
    const combined = `${errorMessage} ${stackTrace}`.toLowerCase();

    // Snapshot mismatch detection
    if (combined.includes('snapshot') &&
        (combined.includes('mismatch') || combined.includes('does not match'))) {
      return FailureType.SNAPSHOT;
    }

    // Assertion failures
    if (combined.includes('expected') && combined.includes('received')) {
      return FailureType.ASSERTION;
    }

    // Property/field name changes (check before type error for specificity)
    if (combined.includes('is not a function') ||
        (combined.includes('undefined') && combined.includes('property'))) {
      return FailureType.PROPERTY_CHANGE;
    }

    // Mock issues
    if (combined.includes('mock') || combined.includes('spy')) {
      return FailureType.MOCK;
    }

    // TypeScript type errors
    if (combined.includes('type') &&
        (combined.includes('error') || combined.includes('mismatch'))) {
      return FailureType.TYPE_ERROR;
    }

    return FailureType.UNKNOWN;
  }

  /**
   * Calculates confidence score based on failure clarity
   */
  private calculateConfidence(failure: TestFailure, type: FailureType): number {
    // Unknown types get low confidence
    if (type === FailureType.UNKNOWN) return 0.3;

    // Snapshot updates are high confidence (straightforward)
    if (type === FailureType.SNAPSHOT) return 0.9;

    // Others depend on error message clarity
    const hasStackTrace = failure.stackTrace.length > 0;
    const hasDetailedError = failure.errorMessage.length > 50;

    let confidence = 0.7;
    if (hasStackTrace) confidence += 0.1;
    if (hasDetailedError) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Extracts the specific code section that failed from stack trace
   */
  private extractAffectedCode(failure: TestFailure): string {
    // For now, return the stack trace
    // In a real implementation, would parse stack trace to extract line numbers
    // and fetch actual code from the test file
    return failure.stackTrace;
  }
}
