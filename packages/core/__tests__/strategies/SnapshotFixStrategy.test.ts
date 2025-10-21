import { SnapshotFixStrategy } from '../../strategies/SnapshotFixStrategy';
import { FailureType } from '../../models/TestFailure';
import type { AnalyzedFailure } from '../../models/TestFailure';

describe('SnapshotFixStrategy', () => {
  let strategy: SnapshotFixStrategy;

  beforeEach(() => {
    strategy = new SnapshotFixStrategy();
  });

  describe('canHandle', () => {
    it('should handle snapshot failures', () => {
      const failure: AnalyzedFailure = {
        testName: 'test',
        testFile: 'test.ts',
        errorMessage: 'snapshot mismatch',
        stackTrace: '',
        jobId: 'job-1',
        buildNumber: 100,
        commitSha: 'abc',
        timestamp: new Date(),
        runner: 'jest',
        failureType: FailureType.SNAPSHOT,
        confidence: 0.9,
        affectedCode: ''
      };

      expect(strategy.canHandle(failure)).toBe(true);
    });

    it('should not handle other failure types', () => {
      const failure: AnalyzedFailure = {
        testName: 'test',
        testFile: 'test.ts',
        errorMessage: 'assertion failed',
        stackTrace: '',
        jobId: 'job-1',
        buildNumber: 100,
        commitSha: 'abc',
        timestamp: new Date(),
        runner: 'jest',
        failureType: FailureType.ASSERTION,
        confidence: 0.9,
        affectedCode: ''
      };

      expect(strategy.canHandle(failure)).toBe(false);
    });
  });

  describe('generateFix', () => {
    it('should generate fix for snapshot failure', async () => {
      const failure: AnalyzedFailure = {
        testName: 'renders Button correctly',
        testFile: 'Button.test.ts',
        errorMessage: 'Snapshot mismatch',
        stackTrace: 'at Button.test.ts:42',
        jobId: 'job-1',
        buildNumber: 100,
        commitSha: 'abc123',
        timestamp: new Date(),
        runner: 'jest',
        failureType: FailureType.SNAPSHOT,
        confidence: 0.95,
        affectedCode: 'expect(wrapper).toMatchSnapshot()'
      };

      const testContent = 'test("renders Button correctly", () => { expect(wrapper).toMatchSnapshot() })';
      const result = await strategy.generateFix(failure, testContent);

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('snapshot');
      expect(result.confidence).toBe(0.95);
      expect(result.explanation).toContain('snapshot');
      expect(result.filePath).toBe('Button.test.ts');
    });

    it('should include code diff context in explanation', async () => {
      const failure: AnalyzedFailure = {
        testName: 'test',
        testFile: 'test.ts',
        errorMessage: 'Snapshot mismatch',
        stackTrace: '',
        jobId: 'job-1',
        buildNumber: 100,
        commitSha: 'abc',
        timestamp: new Date(),
        runner: 'jest',
        failureType: FailureType.SNAPSHOT,
        confidence: 0.9,
        affectedCode: ''
      };

      const codeDiff = '+  newProp: string';
      const result = await strategy.generateFix(failure, 'test content', codeDiff);

      expect(result.explanation).toContain('code modifications');
    });

    it('should maintain test file content as-is', async () => {
      const failure: AnalyzedFailure = {
        testName: 'test',
        testFile: 'test.ts',
        errorMessage: 'Snapshot mismatch',
        stackTrace: '',
        jobId: 'job-1',
        buildNumber: 100,
        commitSha: 'abc',
        timestamp: new Date(),
        runner: 'jest',
        failureType: FailureType.SNAPSHOT,
        confidence: 0.9,
        affectedCode: ''
      };

      const content = 'original test content';
      const result = await strategy.generateFix(failure, content);

      // Snapshot fixes don't modify test files, Jest handles it with -u
      expect(result.originalCode).toBe(content);
      expect(result.fixedCode).toBe(content);
    });
  });

  describe('name', () => {
    it('should have correct strategy name', () => {
      expect(strategy.name).toBe('snapshot');
    });
  });
});
