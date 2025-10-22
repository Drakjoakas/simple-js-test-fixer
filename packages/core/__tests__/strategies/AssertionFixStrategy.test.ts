import { AssertionFixStrategy } from '../../strategies/AssertionFixStrategy';
import { FailureType } from '../../models/TestFailure';
import type { AnalyzedFailure } from '../../models/TestFailure';
import { OpenAIClient } from '../../integrations/OpenAIClient';

describe('AssertionFixStrategy', () => {
  let strategy: AssertionFixStrategy;
  let mockOpenAIClient: OpenAIClient;

  beforeEach(() => {
    // Create a mock OpenAI client
    mockOpenAIClient = {
      generateTestFix: jest.fn().mockResolvedValue({
        fixedCode: '// AI generated fix',
        explanation: 'AI-generated fix explanation',
        tokensUsed: 100
      })
    } as any;

    strategy = new AssertionFixStrategy(mockOpenAIClient);
  });

  describe('canHandle', () => {
    it('should handle assertion failures', () => {
      const failure: AnalyzedFailure = {
        testName: 'test',
        testFile: 'test.ts',
        errorMessage: 'expected "foo" received "bar"',
        stackTrace: '',
        jobId: 'job-1',
        buildNumber: 100,
        commitSha: 'abc',
        timestamp: new Date(),
        runner: 'jest',
        failureType: FailureType.ASSERTION,
        confidence: 0.8,
        affectedCode: ''
      };

      expect(strategy.canHandle(failure)).toBe(true);
    });

    it('should not handle other failure types', () => {
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

      expect(strategy.canHandle(failure)).toBe(false);
    });
  });

  describe('generateFix', () => {
    it('should fix simple assertion with "expected/received" pattern', async () => {
      const failure: AnalyzedFailure = {
        testName: 'validates name',
        testFile: 'user.test.ts',
        errorMessage: 'Expected: "John", Received: "Jane"',
        stackTrace: '',
        jobId: 'job-1',
        buildNumber: 100,
        commitSha: 'abc',
        timestamp: new Date(),
        runner: 'jest',
        failureType: FailureType.ASSERTION,
        confidence: 0.8,
        affectedCode: ''
      };

      const testContent = 'expect(user.name).toBe("John")';
      const result = await strategy.generateFix(failure, testContent);

      expect(result.success).toBe(true);
      expect(result.fixedCode).toContain('Jane');
      expect(result.strategy).toBe('assertion');
    });

    it('should fix assertion with "but got" pattern', async () => {
      const failure: AnalyzedFailure = {
        testName: 'test',
        testFile: 'test.ts',
        errorMessage: 'Expected "old" but got "new"',
        stackTrace: '',
        jobId: 'job-1',
        buildNumber: 100,
        commitSha: 'abc',
        timestamp: new Date(),
        runner: 'jest',
        failureType: FailureType.ASSERTION,
        confidence: 0.8,
        affectedCode: ''
      };

      const testContent = 'expect(value).toBe("old")';
      const result = await strategy.generateFix(failure, testContent);

      expect(result.success).toBe(true);
      expect(result.fixedCode).toContain('new');
    });

    it('should use AI for unparseable assertion errors', async () => {
      const failure: AnalyzedFailure = {
        testName: 'test',
        testFile: 'test.ts',
        errorMessage: 'Some weird error format',
        stackTrace: '',
        jobId: 'job-1',
        buildNumber: 100,
        commitSha: 'abc',
        timestamp: new Date(),
        runner: 'jest',
        failureType: FailureType.ASSERTION,
        confidence: 0.8,
        affectedCode: ''
      };

      const testContent = 'test content';
      const result = await strategy.generateFix(failure, testContent);

      // Should use AI when simple parsing fails
      expect(result.success).toBe(true);
      expect(result.strategy).toBe('assertion-ai');
      expect(mockOpenAIClient.generateTestFix).toHaveBeenCalled();
    });

    it('should provide explanation of the fix', async () => {
      const failure: AnalyzedFailure = {
        testName: 'test',
        testFile: 'test.ts',
        errorMessage: 'Expected: "userId" but got "user_id"',
        stackTrace: '',
        jobId: 'job-1',
        buildNumber: 100,
        commitSha: 'abc',
        timestamp: new Date(),
        runner: 'jest',
        failureType: FailureType.ASSERTION,
        confidence: 0.8,
        affectedCode: ''
      };

      const testContent = 'expect(data).toBe("userId")';
      const result = await strategy.generateFix(failure, testContent);

      expect(result.explanation).toContain('user_id');
      expect(result.explanation).toContain('userId');
    });

    it('should have high confidence for simple fixes', async () => {
      const failure: AnalyzedFailure = {
        testName: 'test',
        testFile: 'test.ts',
        errorMessage: 'Expected: "foo" Received: "bar"',
        stackTrace: '',
        jobId: 'job-1',
        buildNumber: 100,
        commitSha: 'abc',
        timestamp: new Date(),
        runner: 'jest',
        failureType: FailureType.ASSERTION,
        confidence: 0.8,
        affectedCode: ''
      };

      const testContent = 'expect(x).toBe("foo")';
      const result = await strategy.generateFix(failure, testContent);

      expect(result.confidence).toBe(0.85);
    });
  });

  describe('name', () => {
    it('should have correct strategy name', () => {
      expect(strategy.name).toBe('assertion');
    });
  });
});
