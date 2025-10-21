/**
 * Data needed to create a pull request
 */
export interface PRData {
  // Repository info
  owner: string;
  repo: string;
  baseBranch: string; // Usually 'main' or 'master'

  // PR details
  title: string;
  description: string;
  branchName: string;

  // Changes to commit
  changes: FileChange[];

  // Metadata
  commitMessage: string;
  labels?: string[];
}

/**
 * A single file change in a PR
 */
export interface FileChange {
  path: string;
  content: string;
  operation: 'create' | 'update' | 'delete';
}

/**
 * Created pull request information
 */
export interface CreatedPR {
  url: string;
  number: number;
  branchName: string;
  filesChanged: number;
}
