import { AnalyzedFailure, FixResult } from '../models';

/**
 * Interface for fix strategies
 * Each strategy handles a specific type of test failure
 */
export interface IFixStrategy {
  /**
   * Name of the strategy (e.g., "snapshot", "assertion")
   */
  readonly name: string;

  /**
   * Generates a fix for the given failure
   *
   * @param failure - The analyzed test failure
   * @param testFileContent - Full content of the test file
   * @param codeDiff - Optional diff of the code changes that caused the failure
   * @returns A fix result with the proposed changes
   */
  generateFix(
    failure: AnalyzedFailure,
    testFileContent: string,
    codeDiff?: string
  ): Promise<FixResult>;

  /**
   * Validates if this strategy can handle the given failure
   */
  canHandle(failure: AnalyzedFailure): boolean;
}
