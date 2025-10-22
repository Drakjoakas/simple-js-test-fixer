import type { Pipeline } from '../types';

interface PipelineCardProps {
  pipeline: Pipeline;
  isExpanded: boolean;
  onClick: () => void;
}

export function PipelineCard({ pipeline, isExpanded, onClick }: PipelineCardProps) {
  const statusColors = {
    success: 'bg-green-100 text-green-800 border-green-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
    running: 'bg-blue-100 text-blue-800 border-blue-300',
    unknown: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const statusIcons = {
    success: '✓',
    failed: '✗',
    running: '↻',
    unknown: '?',
  };

  // Extract branch name from trigger_parameters
  const branch = pipeline.trigger_parameters?.git?.branch ||
                 pipeline.trigger_parameters?.github_app?.branch ||
                 'unknown';

  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-4 mb-3 cursor-pointer transition-all hover:shadow-md ${
        isExpanded ? 'ring-2 ring-blue-500 shadow-md' : ''
      } ${statusColors[pipeline.status]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{statusIcons[pipeline.status]}</span>
            <div>
              <h3 className="font-semibold text-lg">
                Pipeline #{pipeline.number}
              </h3>
              <p className="text-sm opacity-80">
                {branch} • {new Date(pipeline.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-3 flex gap-4 text-sm">
            <span>
              Total: <strong>{pipeline.workflowSummary.total}</strong>
            </span>
            {pipeline.workflowSummary.success > 0 && (
              <span className="text-green-700">
                Success: <strong>{pipeline.workflowSummary.success}</strong>
              </span>
            )}
            {pipeline.workflowSummary.failed > 0 && (
              <span className="text-red-700">
                Failed: <strong>{pipeline.workflowSummary.failed}</strong>
              </span>
            )}
            {pipeline.workflowSummary.running > 0 && (
              <span className="text-blue-700">
                Running: <strong>{pipeline.workflowSummary.running}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="text-sm font-medium">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>
    </div>
  );
}
