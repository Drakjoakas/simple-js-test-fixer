import type {
  PipelinesResponse,
  PipelineDetailsResponse,
  FailuresResponse,
  AnalysisResponse,
  GenerateFixesResponse,
  FixResponse,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
  async getPipelines(slug?: string, limit = 20): Promise<PipelinesResponse> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (slug) {
      params.append('slug', slug);
    }
    return fetchAPI<PipelinesResponse>(
      `${API_BASE}/pipelines?${params.toString()}`
    );
  },

  // Get detailed info about a specific pipeline
  async getPipelineDetails(slug: string | undefined, pipelineNumber: number): Promise<PipelineDetailsResponse> {
    const params = new URLSearchParams({ pipeline: pipelineNumber.toString() });
    if (slug) {
      params.append('slug', slug);
    }
    return fetchAPI<PipelineDetailsResponse>(
      `${API_BASE}/pipeline-details?${params.toString()}`
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
  async generateFixes(pipelineId: string, slug?: string): Promise<GenerateFixesResponse> {
    const body: { pipelineId: string; slug?: string } = { pipelineId };
    if (slug) {
      body.slug = slug;
    }
    return fetchAPI<GenerateFixesResponse>(`${API_BASE}/generate-fixes`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Create PR with fixes (end-to-end)
  async createFixPR(pipelineId: string): Promise<FixResponse> {
    return fetchAPI<FixResponse>(`${API_BASE}/fix/${pipelineId}`, {
      method: 'POST',
    });
  },
};
