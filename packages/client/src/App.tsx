import { useState, useEffect } from 'react';
import { PipelineCard } from './components/PipelineCard';
import { PipelineDetails } from './components/PipelineDetails';
import { api } from './api';
import type {
  Pipeline,
  PipelineDetails as PipelineDetailsType,
  TestFailure,
  AnalyzedFailure,
  FixProposal,
  PullRequest,
} from './types';

interface PipelineState {
  details: PipelineDetailsType | null;
  failures: TestFailure[] | null;
  analysis: AnalyzedFailure[] | null;
  fixProposal: FixProposal | null;
  pullRequest: PullRequest | null;
  loading: {
    details: boolean;
    failures: boolean;
    analysis: boolean;
    fixes: boolean;
    pr: boolean;
  };
}

function App() {
  const [slug, setSlug] = useState('');
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);
  const [pipelineStates, setPipelineStates] = useState<Record<string, PipelineState>>({});

  const loadPipelines = async () => {
    setLoading(true);
    setError(null);
    try {
      // Slug is now optional - backend will use CIRCLECI_ORG_SLUG if not provided
      const response = await api.getPipelines(slug || undefined, 20);
      setPipelines(response.pipelines);

      // Extract slug from first pipeline if available and update the input
      if (response.pipelines.length > 0 && !slug) {
        setSlug(response.pipelines[0].project_slug);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipelines');
    } finally {
      setLoading(false);
    }
  };

  const togglePipeline = (pipelineId: string) => {
    if (expandedPipeline === pipelineId) {
      setExpandedPipeline(null);
    } else {
      setExpandedPipeline(pipelineId);
      // Initialize state if not exists
      if (!pipelineStates[pipelineId]) {
        setPipelineStates((prev) => ({
          ...prev,
          [pipelineId]: {
            details: null,
            failures: null,
            analysis: null,
            fixProposal: null,
            pullRequest: null,
            loading: {
              details: false,
              failures: false,
              analysis: false,
              fixes: false,
              pr: false,
            },
          },
        }));
      }
    }
  };

  const updatePipelineState = (pipelineId: string, updates: Partial<PipelineState>) => {
    setPipelineStates((prev) => ({
      ...prev,
      [pipelineId]: {
        ...prev[pipelineId],
        ...updates,
        loading: {
          ...prev[pipelineId].loading,
          ...(updates.loading || {}),
        },
      },
    }));
  };

  const loadPipelineDetails = async (pipelineId: string, pipelineNumber: number, pipelineSlug: string) => {
    updatePipelineState(pipelineId, { loading: { ...pipelineStates[pipelineId].loading, details: true } });
    try {
      const response = await api.getPipelineDetails(pipelineSlug, pipelineNumber);
      updatePipelineState(pipelineId, {
        details: response.details,
        loading: { ...pipelineStates[pipelineId].loading, details: false },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipeline details');
      updatePipelineState(pipelineId, { loading: { ...pipelineStates[pipelineId].loading, details: false } });
    }
  };

  const loadFailures = async (pipelineId: string) => {
    updatePipelineState(pipelineId, { loading: { ...pipelineStates[pipelineId].loading, failures: true } });
    try {
      const response = await api.getFailures(pipelineId);
      updatePipelineState(pipelineId, {
        failures: response.failures,
        loading: { ...pipelineStates[pipelineId].loading, failures: false },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load failures');
      updatePipelineState(pipelineId, { loading: { ...pipelineStates[pipelineId].loading, failures: false } });
    }
  };

  const analyzeFailures = async (pipelineId: string) => {
    updatePipelineState(pipelineId, { loading: { ...pipelineStates[pipelineId].loading, analysis: true } });
    try {
      const response = await api.analyzeFailures(pipelineId);
      updatePipelineState(pipelineId, {
        analysis: response.analyzed,
        loading: { ...pipelineStates[pipelineId].loading, analysis: false },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze failures');
      updatePipelineState(pipelineId, { loading: { ...pipelineStates[pipelineId].loading, analysis: false } });
    }
  };

  const generateFixes = async (pipelineId: string, pipelineSlug: string) => {
    updatePipelineState(pipelineId, { loading: { ...pipelineStates[pipelineId].loading, fixes: true } });
    try {
      const response = await api.generateFixes(pipelineId, pipelineSlug);
      updatePipelineState(pipelineId, {
        fixProposal: response.proposal,
        loading: { ...pipelineStates[pipelineId].loading, fixes: false },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate fixes');
      updatePipelineState(pipelineId, { loading: { ...pipelineStates[pipelineId].loading, fixes: false } });
    }
  };

  const createPR = async (pipelineId: string) => {
    updatePipelineState(pipelineId, { loading: { ...pipelineStates[pipelineId].loading, pr: true } });
    try {
      const response = await api.createFixPR(pipelineId);
      updatePipelineState(pipelineId, {
        pullRequest: response.result,
        loading: { ...pipelineStates[pipelineId].loading, pr: false },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create PR');
      updatePipelineState(pipelineId, { loading: { ...pipelineStates[pipelineId].loading, pr: false } });
    }
  };

  // Auto-load pipelines on mount if slug is in URL or localStorage
  useEffect(() => {
    const savedSlug = localStorage.getItem('projectSlug');
    if (savedSlug) {
      setSlug(savedSlug);
    }
  }, []);

  // Save slug to localStorage when it changes
  useEffect(() => {
    if (slug) {
      localStorage.setItem('projectSlug', slug);
    }
  }, [slug]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">TestFixer AI</h1>
          <p className="text-sm text-gray-600">Automated test repair for CircleCI pipelines</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Project slug (optional, e.g., gh/owner/repo)"
              className="flex-1 px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && loadPipelines()}
            />
            <button
              onClick={loadPipelines}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
            >
              {loading ? 'Loading...' : 'Load Pipelines'}
            </button>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Pipeline Stats */}
        {pipelines.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-sm text-gray-600">Total Pipelines</div>
              <div className="text-3xl font-bold">{pipelines.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-sm text-gray-600">Failed</div>
              <div className="text-3xl font-bold text-red-600">
                {pipelines.filter((p) => p.status === 'failed').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-sm text-gray-600">Success</div>
              <div className="text-3xl font-bold text-green-600">
                {pipelines.filter((p) => p.status === 'success').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-sm text-gray-600">Running</div>
              <div className="text-3xl font-bold text-blue-600">
                {pipelines.filter((p) => p.status === 'running').length}
              </div>
            </div>
          </div>
        )}

        {/* Pipeline List */}
        {pipelines.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-600">
            Click "Load Pipelines" to view recent CircleCI pipelines
          </div>
        )}

        {pipelines.map((pipeline) => {
          const isExpanded = expandedPipeline === pipeline.id;
          const state = pipelineStates[pipeline.id];

          return (
            <div key={pipeline.id}>
              <PipelineCard
                pipeline={pipeline}
                isExpanded={isExpanded}
                onClick={() => togglePipeline(pipeline.id)}
              />
              {isExpanded && state && (
                <PipelineDetails
                  pipelineId={pipeline.id}
                  pipelineNumber={pipeline.number}
                  slug={pipeline.project_slug}
                  details={state.details}
                  failures={state.failures}
                  analysis={state.analysis}
                  fixProposal={state.fixProposal}
                  pullRequest={state.pullRequest}
                  loading={state.loading}
                  onLoadDetails={() => loadPipelineDetails(pipeline.id, pipeline.number, pipeline.project_slug)}
                  onLoadFailures={() => loadFailures(pipeline.id)}
                  onAnalyze={() => analyzeFailures(pipeline.id)}
                  onGenerateFixes={() => generateFixes(pipeline.id, pipeline.project_slug)}
                  onCreatePR={() => createPR(pipeline.id)}
                />
              )}
            </div>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-600">
          TestFixer AI - Built for CircleCI Build Summit 2025
        </div>
      </footer>
    </div>
  );
}

export default App;
