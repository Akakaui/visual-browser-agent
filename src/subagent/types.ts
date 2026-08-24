export interface SubagentTask {
  taskId: string;
  role: string;
  goal: string;
  inputContext: unknown;
  allowedTools: string[];
  outputSchema: Record<string, unknown>;
  deadline?: number;
  budget?: number;
  riskLevel: 'low' | 'medium' | 'high';
  dependencyIds: string[];
  successCriteria: string[];
  cancellationPolicy: 'auto' | 'manual';
}

export interface SubagentResult {
  taskId: string;
  status: 'complete' | 'partial' | 'blocked' | 'needs_clarification' | 'failed';
  outputs: Record<string, unknown>;
  provenance: string[];
  citations: string[];
  confidence: number;
  failureDetails?: string;
}

export interface DelegationPlan {
  executionMode: 'sequential' | 'parallel' | 'hierarchical' | 'reviewer_loop';
  tasks: SubagentTask[];
  synthesisRules: string[];
}
