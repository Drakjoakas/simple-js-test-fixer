import { useState, useEffect } from 'react';
import type {
  PipelineDetails,
  TestFailure,
  AnalyzedFailure,
  FixProposal,
  PullRequest,
} from '../types';

interface PipelineDetailsProps {
  pipelineId: string;
  pipelineNumber: number;
  slug: string;
  details: PipelineDetails | null;
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
  onLoadDetails: () => void;
  onLoadFailures: () => void;
  onAnalyze: () => void;
  onGenerateFixes: () => void;
  onCreatePR: () => void;
}

export function PipelineDetails({
  details,
  failures,
  analysis,
  fixProposal,
  pullRequest,
  loading,
  onLoadDetails,
  onLoadFailures,
  onAnalyze,
  onGenerateFixes,
  onCreatePR,
}: PipelineDetailsProps) {
  const [activeTab, setActiveTab] = useState<'workflows' | 'failures' | 'analysis' | 'fixes'>('workflows');

  // Auto-switch to the appropriate tab when NEW data loads (only once per data load)
  useEffect(() => {
    if (fixProposal) {
      setActiveTab('fixes');
    }
  }, [fixProposal]);

  useEffect(() => {
    if (analysis && !fixProposal) {
      setActiveTab('analysis');
    }
  }, [analysis]);

  useEffect(() => {
    if (failures && !analysis) {
      setActiveTab('failures');
    }
  }, [failures]);

  useEffect(() => {
    if (details && !failures && !analysis && !fixProposal) {
      setActiveTab('workflows');
    }
  }, [details]);

  return (
    <div className="bg-white border rounded-lg mt-3 overflow-hidden">
      {/* Action Buttons */}
      <div className="bg-gray-50 p-4 border-b flex flex-wrap gap-2">
        {!details && (
          <button
            onClick={onLoadDetails}
            disabled={loading.details}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading.details ? 'Loading Details...' : 'Load Pipeline Details'}
          </button>
        )}
        {!failures && (
          <button
            onClick={onLoadFailures}
            disabled={loading.failures}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading.failures ? 'Loading Failures...' : 'Load Failures'}
          </button>
        )}
        {failures && !analysis && (
          <button
            onClick={onAnalyze}
            disabled={loading.analysis}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 transition"
          >
            {loading.analysis ? 'Analyzing...' : 'Analyze Failures'}
          </button>
        )}
        {analysis && !fixProposal && (
          <button
            onClick={onGenerateFixes}
            disabled={loading.fixes}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 transition"
          >
            {loading.fixes ? 'Generating...' : 'Generate Fixes'}
          </button>
        )}
        {fixProposal && !pullRequest && (
          <button
            onClick={onCreatePR}
            disabled={loading.pr}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition font-semibold"
          >
            {loading.pr ? 'Creating PR...' : 'Create Pull Request'}
          </button>
        )}
        {pullRequest && (
          <a
            href={pullRequest.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold"
          >
            View PR #{pullRequest.number} on GitHub →
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {details && (
          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'workflows'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Workflows ({details.workflows.length})
          </button>
        )}
        {failures && (
          <button
            onClick={() => setActiveTab('failures')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'failures'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Failures ({failures.length})
          </button>
        )}
        {analysis && (
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'analysis'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Analysis
          </button>
        )}
        {fixProposal && (
          <button
            onClick={() => setActiveTab('fixes')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'fixes'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Fixes ({fixProposal.fixes.length})
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'workflows' && details && (
          <div className="space-y-3">
            {details.workflows.map((workflow) => (
              <div
                key={workflow.id}
                className={`border rounded p-3 ${
                  workflow.status === 'failed'
                    ? 'border-red-300 bg-red-50'
                    : workflow.status === 'success'
                    ? 'border-green-300 bg-green-50'
                    : 'border-blue-300 bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{workflow.name}</h4>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      workflow.status === 'failed'
                        ? 'bg-red-200 text-red-800'
                        : workflow.status === 'success'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}
                  >
                    {workflow.status.toUpperCase()}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  {workflow.summary.total} jobs • {workflow.summary.success} passed • {workflow.summary.failed} failed
                </div>
                {workflow.failedJobs.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-red-700">Failed Jobs:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {workflow.failedJobs.map((job) => (
                        <li key={job.id}>{job.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'failures' && failures && (
          <div className="space-y-3">
            {failures.length === 0 ? (
              <div className="text-center text-gray-600 py-8">
                No test failures found in this pipeline
              </div>
            ) : (
              failures.map((failure, index) => (
                <div key={index} className="border border-red-300 rounded p-3 bg-red-50">
                  <div className="font-medium text-red-900">{failure.testName}</div>
                  <div className="text-sm text-gray-600 mt-1">{failure.testFile}</div>
                  <div className="mt-2 text-sm bg-white p-2 rounded border">
                    <pre className="whitespace-pre-wrap text-red-700 overflow-x-auto">{failure.errorMessage}</pre>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'analysis' && analysis && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {Object.entries(
                analysis.reduce((acc, item) => {
                  acc[item.failureType] = (acc[item.failureType] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <div key={type} className="border rounded p-3 bg-gray-50">
                  <div className="text-sm text-gray-600">{type}</div>
                  <div className="text-2xl font-bold">{count}</div>
                </div>
              ))}
            </div>
            {analysis.map((item, index) => (
              <div key={index} className="border border-purple-300 rounded p-3 bg-purple-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{item.testName}</div>
                    <div className="text-sm text-gray-600">{item.testFile}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded">
                      {item.failureType}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.confidence >= 0.8
                          ? 'bg-green-200 text-green-800'
                          : item.confidence >= 0.5
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {Math.round(item.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-700 italic">{item.suggestedFix}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'fixes' && fixProposal && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-300 rounded p-3 mb-4">
              <div className="font-semibold text-blue-900">Fix Summary</div>
              <div className="mt-2 text-sm text-blue-800 space-y-1">
                <div>Branch: <strong>{fixProposal.branch}</strong></div>
                <div>Total fixes: <strong>{fixProposal.fixes.length}</strong></div>
                <div>Average confidence: <strong>{Math.round(fixProposal.totalConfidence * 100)}%</strong></div>
                <div>Estimated time saved: <strong>{fixProposal.estimatedTimesSaved} minutes</strong></div>
              </div>
            </div>
            {fixProposal.fixes.map((fix, index) => (
              <div key={index} className="border border-green-300 rounded p-3 bg-green-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-green-900">{fix.filePath}</div>
                  <div className="flex gap-2 items-center">
                    {fix.strategy && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-200 text-blue-800">
                        {fix.strategy}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        fix.confidence >= 0.8
                          ? 'bg-green-200 text-green-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {Math.round(fix.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-700 mb-2 italic">{fix.explanation}</div>
                {fix.aiModel && (
                  <div className="text-xs text-gray-500 mb-2">
                    Model: {fix.aiModel} • Tokens: {fix.tokensUsed}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">Before:</div>
                    <pre className="text-xs bg-white p-2 rounded border overflow-x-auto max-h-96">
                      {fix.originalCode}
                    </pre>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">After:</div>
                    <pre className="text-xs bg-white p-2 rounded border overflow-x-auto max-h-96">
                      {fix.fixedCode}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pullRequest && (
          <div className="bg-green-50 border border-green-300 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✓</span>
              <h4 className="font-semibold text-green-900">Pull Request Created Successfully!</h4>
            </div>
            <div className="text-sm text-gray-700 mb-3">
              <strong>PR #{pullRequest.number}:</strong> {pullRequest.title}
            </div>
            {pullRequest.fixes && pullRequest.fixes.length > 0 && (
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Fixed {pullRequest.fixes.length} test file(s):</p>
                <ul className="list-disc list-inside">
                  {pullRequest.fixes.map((fix, idx) => (
                    <li key={idx}>{fix.testFile}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!details && !failures && !analysis && !fixProposal && !pullRequest && (
          <div className="text-center text-gray-600 py-8">
            Click the buttons above to load pipeline data
          </div>
        )}
      </div>
    </div>
  );
}
