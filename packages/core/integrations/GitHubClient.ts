import { PRData, CreatedPR, FileChange } from '../models';

/**
 * Configuration for GitHub client
 */
export interface GitHubConfig {
  token: string;
  baseUrl?: string;
}

/**
 * GitHub API response types
 */
export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
  };
}

export interface GitHubPR {
  number: number;
  html_url: string;
  head: {
    ref: string;
  };
}

/**
 * Client for interacting with GitHub API
 */
export class GitHubClient {
  private token: string;
  private baseUrl: string;

  constructor(config: GitHubConfig) {
    this.token = config.token;
    this.baseUrl = config.baseUrl || 'https://api.github.com';
  }

  /**
   * Gets file content from a repository
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`;
    const params = ref ? `?ref=${ref}` : '';

    const response = await this.fetch(`${url}${params}`);

    // GitHub returns base64 encoded content
    if (response.content) {
      return Buffer.from(response.content, 'base64').toString('utf-8');
    }

    throw new Error(`Could not fetch content for ${path}`);
  }

  /**
   * Gets the diff for a specific commit
   */
  async getCommitDiff(
    owner: string,
    repo: string,
    commitSha: string
  ): Promise<string> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/commits/${commitSha}`;

    const response = await this.fetch(url, {
      Accept: 'application/vnd.github.v3.diff'
    });

    return response;
  }

  /**
   * Creates a new branch
   */
  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    fromSha: string
  ): Promise<void> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/git/refs`;

    await this.fetch(url, undefined, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: fromSha
      })
    });
  }

  /**
   * Creates or updates a file in the repository
   */
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    sha?: string
  ): Promise<void> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`;

    const body: any = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch
    };

    if (sha) {
      body.sha = sha; // Required for updates
    }

    await this.fetch(url, undefined, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  /**
   * Creates a pull request
   */
  async createPullRequest(prData: PRData): Promise<CreatedPR> {
    // First, create branch
    const defaultBranch = await this.getDefaultBranch(prData.owner, prData.repo);
    const latestCommit = await this.getLatestCommit(prData.owner, prData.repo, prData.baseBranch);

    await this.createBranch(prData.owner, prData.repo, prData.branchName, latestCommit.sha);

    // Commit changes to the new branch
    for (const change of prData.changes) {
      await this.createOrUpdateFile(
        prData.owner,
        prData.repo,
        change.path,
        change.content,
        prData.commitMessage,
        prData.branchName
      );
    }

    // Create PR
    const url = `${this.baseUrl}/repos/${prData.owner}/${prData.repo}/pulls`;
    const pr = await this.fetch(url, undefined, {
      method: 'POST',
      body: JSON.stringify({
        title: prData.title,
        body: prData.description,
        head: prData.branchName,
        base: prData.baseBranch
      })
    });

    // Add labels if specified
    if (prData.labels && prData.labels.length > 0) {
      await this.addLabels(prData.owner, prData.repo, pr.number, prData.labels);
    }

    return {
      url: pr.html_url,
      number: pr.number,
      branchName: prData.branchName,
      filesChanged: prData.changes.length
    };
  }

  /**
   * Gets the default branch for a repository
   */
  private async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}`;
    const response = await this.fetch(url);
    return response.default_branch;
  }

  /**
   * Gets the latest commit on a branch
   */
  private async getLatestCommit(
    owner: string,
    repo: string,
    branch: string
  ): Promise<GitHubCommit> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/commits/${branch}`;
    return this.fetch(url);
  }

  /**
   * Adds labels to a PR
   */
  private async addLabels(
    owner: string,
    repo: string,
    prNumber: number,
    labels: string[]
  ): Promise<void> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/issues/${prNumber}/labels`;
    await this.fetch(url, undefined, {
      method: 'POST',
      body: JSON.stringify({ labels })
    });
  }

  /**
   * Generic fetch helper with auth
   */
  private async fetch(
    url: string,
    headers: Record<string, string> = {},
    options: RequestInit = {}
  ): Promise<any> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        ...headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${error}`);
    }

    // For diff requests, return text
    if (headers.Accept?.includes('diff')) {
      return response.text();
    }

    return response.json();
  }
}
