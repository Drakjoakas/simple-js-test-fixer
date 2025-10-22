import type {
  PipelinesResponse,
  PipelineDetailsResponse,
  FailuresResponse,
  AnalysisResponse,
  GenerateFixesResponse,
  FixResponse,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL + '/api' || '/api';

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Get list of pipelines with status
  async getPipelines(slug: string, limit = 20): Promise<PipelinesResponse> {
    return fetchAPI<PipelinesResponse>(
      `${API_BASE}/pipelines?slug=${encodeURIComponent(slug)}&limit=${limit}`
    );
  },

  // Get detailed info about a specific pipeline
  async getPipelineDetails(slug: string, pipelineNumber: number): Promise<PipelineDetailsResponse> {
    return fetchAPI<PipelineDetailsResponse>(
      `${API_BASE}/pipeline-details?slug=${encodeURIComponent(slug)}&pipeline=${pipelineNumber}`
    );
  },

  // Get test failures for a pipeline
  async getFailures(pipelineId: string): Promise<FailuresResponse> {
    return fetchAPI<FailuresResponse>(`${API_BASE}/failures/${pipelineId}`);
  },

  // Analyze test failures
  async analyzeFailures(pipelineId: string): Promise<AnalysisResponse> {
    return fetchAPI<AnalysisResponse>(`${API_BASE}/analyze/${pipelineId}`);
  },

  // Generate fix proposals
  async generateFixes(pipelineId: string, slug: string): Promise<GenerateFixesResponse> {
    return fetchAPI<GenerateFixesResponse>(`${API_BASE}/generate-fixes`, {
      method: 'POST',
      body: JSON.stringify({ pipelineId, slug }),
    });
  },

  // Create PR with fixes (end-to-end)
  async createFixPR(pipelineId: string): Promise<FixResponse> {
    return fetchAPI<FixResponse>(`${API_BASE}/fix/${pipelineId}`, {
      method: 'POST',
    });
  },
};
