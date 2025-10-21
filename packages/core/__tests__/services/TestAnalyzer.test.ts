import { TestAnalyzer } from '../../services/TestAnalyzer';
import { FailureType } from '../../models/TestFailure';
import type { TestFailure } from '../../models/TestFailure';

describe('TestAnalyzer', () => {
  let analyzer: TestAnalyzer;

  beforeEach(() => {
    analyzer = new TestAnalyzer();
  });

  describe('analyze', () => {
    it('should detect snapshot failures', async () => {
      const failure: TestFailure = {
        testName: 'renders correctly',
        testFile: 'Button.test.ts',
        errorMessage: 'Snapshot mismatch: Expected snapshot to match',
        stackTrace: 'at Button.test.ts:10',
        jobId: 'job-1',
        buildNumber: 100,
        commitSha: 'abc123',
        timestamp: new Date(),
        runner: 'jest'
      };

      const result = await analyzer.analyze(failure);

      expect(result.failureType).toBe(FailureType.SNAPSHOT);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect assertion failures', async () => {
      const failure: TestFailure = {
        testName: 'validates user data',
        testFile: 'user.test.ts',
        errorMessage: 'Expected "John" but received "Jane"',
        stackTrace: 'at user.test.ts:25',
        jobId: 'job-2',
        buildNumber: 101,
        commitSha: 'def456',
        timestamp: new Date(),
        runner: 'jest'
      };

      const result = await analyzer.analyze(failure);

      expect(result.failureType).toBe(FailureType.ASSERTION);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect property change failures', async () => {
      const failure: TestFailure = {
        testName: 'accesses user property',
        testFile: 'api.test.ts',
        errorMessage: 'TypeError: user.getName is not a function',
        stackTrace: 'at api.test.ts:42',
        jobId: 'job-3',
        buildNumber: 102,
        commitSha: 'ghi789',
        timestamp: new Date(),
        runner: 'jest'
      };

      const result = await analyzer.analyze(failure);

      expect(result.failureType).toBe(FailureType.PROPERTY_CHANGE);
    });

    it('should detect mock failures', async () => {
      const failure: TestFailure = {
        testName: 'mocks API call',
        testFile: 'service.test.ts',
        errorMessage: 'Mock function called with unexpected arguments',
        stackTrace: 'at service.test.ts:30',
        jobId: 'job-4',
        buildNumber: 103,
        commitSha: 'jkl012',
        timestamp: new Date(),
        runner: 'jest'
      };

      const result = await analyzer.analyze(failure);

      expect(result.failureType).toBe(FailureType.MOCK);
    });

    it('should detect type errors', async () => {
      const failure: TestFailure = {
        testName: 'type checks',
        testFile: 'types.test.ts',
        errorMessage: 'Type error: expected number but got string',
        stackTrace: 'at types.test.ts:15',
        jobId: 'job-5',
        buildNumber: 104,
        commitSha: 'mno345',
        timestamp: new Date(),
        runner: 'jest'
      };

      const result = await analyzer.analyze(failure);

      expect(result.failureType).toBe(FailureType.TYPE_ERROR);
    });

    it('should handle unknown failure types', async () => {
      const failure: TestFailure = {
        testName: 'unknown error',
        testFile: 'mystery.test.ts',
        errorMessage: 'Something went wrong',
        stackTrace: '',
        jobId: 'job-6',
        buildNumber: 105,
        commitSha: 'pqr678',
        timestamp: new Date(),
        runner: 'jest'
      };

      const result = await analyzer.analyze(failure);

      expect(result.failureType).toBe(FailureType.UNKNOWN);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should calculate higher confidence for clear errors', async () => {
      const clearFailure: TestFailure = {
        testName: 'clear error',
        testFile: 'test.ts',
        errorMessage: 'Snapshot does not match the stored snapshot. Expected value to match stored snapshot.',
        stackTrace: 'at test.ts:10\n    at Object.toBe (node_modules/jest)',
        jobId: 'job-7',
        buildNumber: 106,
        commitSha: 'stu901',
        timestamp: new Date(),
        runner: 'jest'
      };

      const result = await analyzer.analyze(clearFailure);

      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('analyzeMany', () => {
    it('should analyze multiple failures in batch', async () => {
      const failures: TestFailure[] = [
        {
          testName: 'test1',
          testFile: 'file1.test.ts',
          errorMessage: 'Snapshot mismatch',
          stackTrace: '',
          jobId: 'job-1',
          buildNumber: 100,
          commitSha: 'abc',
          timestamp: new Date(),
          runner: 'jest'
        },
        {
          testName: 'test2',
          testFile: 'file2.test.ts',
          errorMessage: 'Expected 5 received 10',
          stackTrace: '',
          jobId: 'job-1',
          buildNumber: 100,
          commitSha: 'abc',
          timestamp: new Date(),
          runner: 'jest'
        }
      ];

      const results = await analyzer.analyzeMany(failures);

      expect(results).toHaveLength(2);
      expect(results[0].failureType).toBe(FailureType.SNAPSHOT);
      expect(results[1].failureType).toBe(FailureType.ASSERTION);
    });

    it('should handle empty array', async () => {
      const results = await analyzer.analyzeMany([]);

      expect(results).toHaveLength(0);
    });
  });
});
