import { GitHubClient } from '../../integrations/GitHubClient';
import type { PRData } from '../../models/PRData';

// Mock fetch globally
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('GitHubClient', () => {
  let client: GitHubClient;

  beforeEach(() => {
    client = new GitHubClient({ token: 'test-token' });
    mockFetch.mockClear();
  });

  describe('getFileContent', () => {
    it('should fetch and decode file content', async () => {
      const content = 'test file content';
      const encoded = Buffer.from(content).toString('base64');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: encoded })
      } as Response);

      const result = await client.getFileContent('owner', 'repo', 'test.ts');

      expect(result).toBe(content);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/repos/owner/repo/contents/test.ts'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      );
    });

    it('should include ref parameter when provided', async () => {
      const encoded = Buffer.from('content').toString('base64');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: encoded })
      } as Response);

      await client.getFileContent('owner', 'repo', 'test.ts', 'abc123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('?ref=abc123'),
        expect.any(Object)
      );
    });

    it('should throw error when content is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      } as Response);

      await expect(
        client.getFileContent('owner', 'repo', 'test.ts')
      ).rejects.toThrow('Could not fetch content');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'File not found'
      } as Response);

      await expect(
        client.getFileContent('owner', 'repo', 'missing.ts')
      ).rejects.toThrow('GitHub API error: 404');
    });
  });

  describe('getCommitDiff', () => {
    it('should fetch commit diff', async () => {
      const diff = '+++ new line\n--- old line';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => diff
      } as Response);

      const result = await client.getCommitDiff('owner', 'repo', 'abc123');

      expect(result).toBe(diff);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/repos/owner/repo/commits/abc123'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/vnd.github.v3.diff'
          })
        })
      );
    });
  });

  describe('createPullRequest', () => {
    it('should create a complete pull request', async () => {
      const prData: PRData = {
        owner: 'testorg',
        repo: 'testrepo',
        baseBranch: 'main',
        title: 'Fix tests',
        description: 'Automated fixes',
        branchName: 'test-fix/123',
        changes: [
          {
            path: 'test.ts',
            content: 'fixed content',
            operation: 'update'
          }
        ],
        commitMessage: 'fix: tests',
        labels: ['automated-fix']
      };

      // Mock responses
      mockFetch
        // Get repo (for default branch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ default_branch: 'main' })
        } as Response)
        // Get latest commit
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sha: 'base-sha' })
        } as Response)
        // Create branch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        } as Response)
        // Get file info (for existing file)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sha: 'file-sha', content: '' })
        } as Response)
        // Create/update file
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        } as Response)
        // Create PR
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            html_url: 'https://github.com/testorg/testrepo/pull/1',
            number: 1
          })
        } as Response)
        // Add labels
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([])
        } as Response);

      const result = await client.createPullRequest(prData);

      expect(result.url).toBe('https://github.com/testorg/testrepo/pull/1');
      expect(result.number).toBe(1);
      expect(result.branchName).toBe('test-fix/123');
      expect(result.filesChanged).toBe(1);
    });

    it('should handle multiple file changes', async () => {
      const prData: PRData = {
        owner: 'org',
        repo: 'repo',
        baseBranch: 'main',
        title: 'Fix',
        description: 'Fixes',
        branchName: 'fix-branch',
        changes: [
          { path: 'file1.ts', content: 'content1', operation: 'update' },
          { path: 'file2.ts', content: 'content2', operation: 'update' }
        ],
        commitMessage: 'fix'
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ default_branch: 'main' }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 'sha' }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 'file1-sha', content: '' }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 'file2-sha', content: '' }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ html_url: 'url', number: 2 })
        } as Response);

      const result = await client.createPullRequest(prData);

      expect(result.filesChanged).toBe(2);
    });
  });
});
