import { FixGenerator } from '../../services/FixGenerator';
import { FailureType } from '../../models/TestFailure';
import type { AnalyzedFailure } from '../../models/TestFailure';
import type { IFixStrategy } from '../../strategies/IFixStrategy';
import type { FixResult } from '../../models/FixResult';

// Mock strategy for testing
class MockFixStrategy implements IFixStrategy {
  readonly name = 'mock-strategy';

  canHandle(failure: AnalyzedFailure): boolean {
    return true;
  }

  async generateFix(
    failure: AnalyzedFailure,
    testFileContent: string,
    codeDiff?: string
  ): Promise<FixResult> {
    return {
      originalCode: testFileContent,
      fixedCode: testFileContent + ' // fixed',
      filePath: failure.testFile,
      strategy: this.name,
      explanation: 'Mock fix applied',
      confidence: 0.8,
      success: true
    };
  }
}

describe('FixGenerator', () => {
  let generator: FixGenerator;

  beforeEach(() => {
    generator = new FixGenerator({ maxConfidenceThreshold: 0.5 });
  });

  describe('registerStrategy', () => {
    it('should register a fix strategy', () => {
      const strategy = new MockFixStrategy();
      generator.registerStrategy(FailureType.SNAPSHOT, strategy);

      // Registration successful if no error thrown
      expect(true).toBe(true);
    });
  });

  describe('generateFix', () => {
    it('should generate a fix using registered strategy', async () => {
      const strategy = new MockFixStrategy();
      generator.registerStrategy(FailureType.SNAPSHOT, strategy);

      const failure: AnalyzedFailure = {
        testName: 'test',
        testFile: 'test.ts',
        errorMessage: 'error',
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

      const result = await generator.generateFix(failure, 'test content');

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('mock-strategy');
      expect(result.fixedCode).toContain('// fixed');
    });

    it('should fail when no strategy is available', async () => {
      const failure: AnalyzedFailure = {
        testName: 'test',
        testFile: 'test.ts',
        errorMessage: 'error',
        stackTrace: '',
        jobId: 'job-1',
        buildNumber: 100,
        commitSha: 'abc',
        timestamp: new Date(),
        runner: 'jest',
        failureType: FailureType.UNKNOWN,
        confidence: 0.9,
        affectedCode: ''
      };

      const result = await generator.generateFix(failure, 'test content');

      expect(result.success).toBe(false);
      expect(result.validationErrors).toContain('No strategy found');
    });

    it('should fail when confidence is below threshold', async () => {
      const strategy = new MockFixStrategy();
      generator.registerStrategy(FailureType.ASSERTION, strategy);

      const failure: AnalyzedFailure = {
        testName: 'test',
        testFile: 'test.ts',
        errorMessage: 'error',
        stackTrace: '',
        jobId: 'job-1',
        buildNumber: 100,
        commitSha: 'abc',
        timestamp: new Date(),
        runner: 'jest',
        failureType: FailureType.ASSERTION,
        confidence: 0.3, // Below threshold
        affectedCode: ''
      };

      const result = await generator.generateFix(failure, 'test content');

      expect(result.success).toBe(false);
      expect(result.validationErrors).toContain('Low confidence');
    });

    it('should pass code diff to strategy', async () => {
      let capturedDiff: string | undefined;

      const strategy: IFixStrategy = {
        name: 'capture-strategy',
        canHandle: () => true,
        generateFix: async (failure, content, diff) => {
          capturedDiff = diff;
          return {
            originalCode: content,
            fixedCode: content,
            filePath: failure.testFile,
            strategy: 'capture-strategy',
            explanation: 'test',
            confidence: 0.8,
            success: true
          };
        }
      };

      generator.registerStrategy(FailureType.SNAPSHOT, strategy);

      const failure: AnalyzedFailure = {
        testName: 'test',
        testFile: 'test.ts',
        errorMessage: 'error',
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

      await generator.generateFix(failure, 'content', 'diff content');

      expect(capturedDiff).toBe('diff content');
    });
  });

  describe('generateProposal', () => {
    it('should generate proposal for multiple failures', async () => {
      const strategy = new MockFixStrategy();
      generator.registerStrategy(FailureType.SNAPSHOT, strategy);
      generator.registerStrategy(FailureType.ASSERTION, strategy);

      const failures: AnalyzedFailure[] = [
        {
          testName: 'test1',
          testFile: 'file1.test.ts',
          errorMessage: 'error1',
          stackTrace: '',
          jobId: 'job-1',
          buildNumber: 100,
          commitSha: 'abc',
          timestamp: new Date(),
          runner: 'jest',
          failureType: FailureType.SNAPSHOT,
          confidence: 0.9,
          affectedCode: ''
        },
        {
          testName: 'test2',
          testFile: 'file2.test.ts',
          errorMessage: 'error2',
          stackTrace: '',
          jobId: 'job-1',
          buildNumber: 100,
          commitSha: 'abc',
          timestamp: new Date(),
          runner: 'jest',
          failureType: FailureType.ASSERTION,
          confidence: 0.8,
          affectedCode: ''
        }
      ];

      const testFiles = new Map([
        ['file1.test.ts', 'content1'],
        ['file2.test.ts', 'content2']
      ]);

      const proposal = await generator.generateProposal(failures, testFiles);

      expect(proposal.fixes).toHaveLength(2);
      expect(proposal.buildNumber).toBe(100);
      expect(proposal.commitSha).toBe('abc');
      expect(proposal.totalConfidence).toBeGreaterThan(0);
      expect(proposal.estimatedTimesSaved).toBeGreaterThan(0);
    });

    it('should calculate average confidence correctly', async () => {
      const strategy = new MockFixStrategy();
      generator.registerStrategy(FailureType.SNAPSHOT, strategy);

      const failures: AnalyzedFailure[] = [
        {
          testName: 'test1',
          testFile: 'test.ts',
          errorMessage: 'error',
          stackTrace: '',
          jobId: 'job-1',
          buildNumber: 100,
          commitSha: 'abc',
          timestamp: new Date(),
          runner: 'jest',
          failureType: FailureType.SNAPSHOT,
          confidence: 0.9,
          affectedCode: ''
        }
      ];

      const testFiles = new Map([['test.ts', 'content']]);
      const proposal = await generator.generateProposal(failures, testFiles);

      expect(proposal.totalConfidence).toBe(0.8); // Strategy returns 0.8
    });

    it('should handle empty failures array', async () => {
      const proposal = await generator.generateProposal([], new Map());

      expect(proposal.fixes).toHaveLength(0);
      expect(proposal.totalConfidence).toBe(0);
      expect(proposal.estimatedTimesSaved).toBe(0);
    });

    it('should filter out failed fixes from confidence calculation', async () => {
      // Strategy that fails for second call
      let callCount = 0;
      const strategy: IFixStrategy = {
        name: 'flaky-strategy',
        canHandle: () => true,
        generateFix: async (failure, content) => {
          callCount++;
          return {
            originalCode: content,
            fixedCode: content,
            filePath: failure.testFile,
            strategy: 'flaky-strategy',
            explanation: 'test',
            confidence: callCount === 1 ? 0.8 : 0.5,
            success: callCount === 1,
            validationErrors: callCount === 1 ? undefined : ['Failed']
          };
        }
      };

      generator.registerStrategy(FailureType.SNAPSHOT, strategy);

      const failures: AnalyzedFailure[] = [
        {
          testName: 'test1',
          testFile: 'test1.ts',
          errorMessage: 'error',
          stackTrace: '',
          jobId: 'job-1',
          buildNumber: 100,
          commitSha: 'abc',
          timestamp: new Date(),
          runner: 'jest',
          failureType: FailureType.SNAPSHOT,
          confidence: 0.9,
          affectedCode: ''
        },
        {
          testName: 'test2',
          testFile: 'test2.ts',
          errorMessage: 'error',
          stackTrace: '',
          jobId: 'job-1',
          buildNumber: 100,
          commitSha: 'abc',
          timestamp: new Date(),
          runner: 'jest',
          failureType: FailureType.SNAPSHOT,
          confidence: 0.9,
          affectedCode: ''
        }
      ];

      const testFiles = new Map([
        ['test1.ts', 'content1'],
        ['test2.ts', 'content2']
      ]);

      const proposal = await generator.generateProposal(failures, testFiles);

      // Only successful fix (0.8 confidence) counted
      expect(proposal.totalConfidence).toBe(0.8);
    });
  });
});
