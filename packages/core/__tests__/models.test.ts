import { FailureType } from '../models/TestFailure';
import type { TestFailure, AnalyzedFailure } from '../models/TestFailure';
import type { FixResult, FixProposal } from '../models/FixResult';
import type { PRData, FileChange } from '../models/PRData';

describe('Models', () => {
  describe('TestFailure', () => {
    it('should create a valid TestFailure object', () => {
      const failure: TestFailure = {
        testName: 'should render correctly',
        testFile: 'src/components/Button.test.ts',
        errorMessage: 'Snapshot mismatch',
        stackTrace: 'at Button.test.ts:42',
        jobId: 'job-123',
        buildNumber: 456,
        commitSha: 'abc123',
        timestamp: new Date(),
        runner: 'jest'
      };

      expect(failure.testName).toBe('should render correctly');
      expect(failure.runner).toBe('jest');
    });

    it('should support all failure types', () => {
      expect(FailureType.SNAPSHOT).toBe('snapshot');
      expect(FailureType.ASSERTION).toBe('assertion');
      expect(FailureType.MOCK).toBe('mock');
      expect(FailureType.TYPE_ERROR).toBe('type_error');
      expect(FailureType.PROPERTY_CHANGE).toBe('property_change');
      expect(FailureType.UNKNOWN).toBe('unknown');
    });
  });

  describe('AnalyzedFailure', () => {
    it('should extend TestFailure with analysis data', () => {
      const analyzed: AnalyzedFailure = {
        testName: 'should render correctly',
        testFile: 'src/components/Button.test.ts',
        errorMessage: 'Snapshot mismatch',
        stackTrace: 'at Button.test.ts:42',
        jobId: 'job-123',
        buildNumber: 456,
        commitSha: 'abc123',
        timestamp: new Date(),
        runner: 'jest',
        failureType: FailureType.SNAPSHOT,
        confidence: 0.9,
        affectedCode: 'expect(wrapper).toMatchSnapshot()'
      };

      expect(analyzed.failureType).toBe(FailureType.SNAPSHOT);
      expect(analyzed.confidence).toBe(0.9);
    });
  });

  describe('FixResult', () => {
    it('should create a successful fix result', () => {
      const fix: FixResult = {
        originalCode: 'expect(user.name).toBe("John")',
        fixedCode: 'expect(user.name).toBe("Jane")',
        filePath: 'user.test.ts',
        strategy: 'assertion',
        explanation: 'Updated name expectation',
        confidence: 0.85,
        success: true
      };

      expect(fix.success).toBe(true);
      expect(fix.confidence).toBe(0.85);
      expect(fix.strategy).toBe('assertion');
    });

    it('should create a failed fix result with errors', () => {
      const fix: FixResult = {
        originalCode: '',
        fixedCode: '',
        filePath: 'test.ts',
        strategy: 'ai-powered',
        explanation: 'Could not parse error',
        confidence: 0,
        success: false,
        validationErrors: ['Parse error', 'Unknown failure type']
      };

      expect(fix.success).toBe(false);
      expect(fix.validationErrors).toHaveLength(2);
    });
  });

  describe('FixProposal', () => {
    it('should aggregate multiple fixes', () => {
      const proposal: FixProposal = {
        buildNumber: 123,
        commitSha: 'abc123',
        fixes: [
          {
            originalCode: 'old1',
            fixedCode: 'new1',
            filePath: 'file1.test.ts',
            strategy: 'snapshot',
            explanation: 'Fix 1',
            confidence: 0.9,
            success: true
          },
          {
            originalCode: 'old2',
            fixedCode: 'new2',
            filePath: 'file2.test.ts',
            strategy: 'assertion',
            explanation: 'Fix 2',
            confidence: 0.8,
            success: true
          }
        ],
        totalConfidence: 0.85,
        estimatedTimesSaved: 30
      };

      expect(proposal.fixes).toHaveLength(2);
      expect(proposal.totalConfidence).toBe(0.85);
      expect(proposal.estimatedTimesSaved).toBe(30);
    });
  });

  describe('PRData', () => {
    it('should create valid PR data', () => {
      const prData: PRData = {
        owner: 'testorg',
        repo: 'testrepo',
        baseBranch: 'main',
        title: 'Fix: 2 test failures',
        description: 'Automated fixes',
        branchName: 'test-fix/abc123',
        changes: [
          {
            path: 'test.ts',
            content: 'fixed content',
            operation: 'update'
          }
        ],
        commitMessage: 'fix: automated test fixes',
        labels: ['automated-fix', 'tests']
      };

      expect(prData.owner).toBe('testorg');
      expect(prData.changes).toHaveLength(1);
      expect(prData.labels).toContain('automated-fix');
    });

    it('should support file operations', () => {
      const change: FileChange = {
        path: 'new-file.ts',
        content: 'content',
        operation: 'create'
      };

      expect(change.operation).toBe('create');
    });
  });
});
