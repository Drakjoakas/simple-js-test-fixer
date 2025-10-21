/**
 * Result of applying a fix to a test
 */
export interface FixResult {
  // Fix details
  originalCode: string;
  fixedCode: string;
  filePath: string;

  // Metadata
  strategy: string; // Name of the strategy used
  explanation: string; // Human-readable explanation
  confidence: number; // 0-1 score

  // Success/validation
  success: boolean;
  validationErrors?: string[];

  // AI metadata (optional)
  aiModel?: string;
  tokensUsed?: number;
}

/**
 * Collection of fixes for a single build failure
 */
export interface FixProposal {
  buildNumber: number;
  commitSha: string;
  fixes: FixResult[];
  totalConfidence: number; // Average confidence across all fixes
  estimatedTimesSaved: number; // In minutes
}
