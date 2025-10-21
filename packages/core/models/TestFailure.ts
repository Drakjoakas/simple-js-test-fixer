/**
 * Represents a test failure detected in CI
 */
export interface TestFailure {
  // Test identification
  testName: string;
  testFile: string;

  // Error details
  errorMessage: string;
  stackTrace: string;

  // CI context
  jobId: string;
  buildNumber: number;
  commitSha: string;

  // Metadata
  timestamp: Date;
  runner: 'jest'; // Can expand later
}

/**
 * Type of test failure for routing to appropriate fixer
 */
export enum FailureType {
  SNAPSHOT = 'snapshot',
  ASSERTION = 'assertion',
  MOCK = 'mock',
  TYPE_ERROR = 'type_error',
  PROPERTY_CHANGE = 'property_change',
  UNKNOWN = 'unknown'
}

/**
 * Analyzed test failure with categorization
 */
export interface AnalyzedFailure extends TestFailure {
  failureType: FailureType;
  confidence: number; // 0-1 score of fix confidence
  affectedCode: string; // The specific test code that failed
}
