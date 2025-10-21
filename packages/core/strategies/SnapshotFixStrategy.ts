import { AnalyzedFailure, FixResult, FailureType } from '../models';
import { IFixStrategy } from './IFixStrategy';

/**
 * Strategy for fixing snapshot test failures
 * This is the most straightforward type - just update the snapshot
 */
export class SnapshotFixStrategy implements IFixStrategy {
  readonly name = 'snapshot';

  canHandle(failure: AnalyzedFailure): boolean {
    return failure.failureType === FailureType.SNAPSHOT;
  }

  async generateFix(
    failure: AnalyzedFailure,
    testFileContent: string,
    codeDiff?: string
  ): Promise<FixResult> {
    // For snapshot failures, we typically just need to regenerate them
    // The actual snapshot update is done by Jest with -u flag
    // Here we prepare the explanation and metadata

    const explanation = this.generateExplanation(failure, codeDiff);

    return {
      originalCode: testFileContent,
      fixedCode: testFileContent, // Snapshot files are handled by Jest
      filePath: failure.testFile,
      strategy: this.name,
      explanation,
      confidence: 0.95, // High confidence for snapshot updates
      success: true
    };
  }

  private generateExplanation(failure: AnalyzedFailure, codeDiff?: string): string {
    let explanation = 'Snapshot mismatch detected. ';

    if (codeDiff) {
      explanation += 'The UI or component output has changed due to recent code modifications. ';
    }

    explanation += 'The snapshot will be updated to match the current output. ';
    explanation += 'Please review the snapshot diff to ensure the changes are intentional.';

    return explanation;
  }
}
