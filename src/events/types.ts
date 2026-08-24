export interface RunEvent {
  type:
    | 'run.started'
    | 'plan.created'
    | 'delegation.created'
    | 'subagent.started'
    | 'subagent.progress'
    | 'subagent.completed'
    | 'subagent.blocked'
    | 'subagent.failed'
    | 'synthesis.started'
    | 'tool.requested'
    | 'approval.required'
    | 'tool.started'
    | 'tool.completed'
    | 'artifact.created'
    | 'artifact.updated'
    | 'run.blocked'
    | 'run.resumed'
    | 'run.completed'
    | 'run.failed';
  timestamp: number;
  taskId: string;
  payload: Record<string, unknown>;
}

export type RunEventType = RunEvent['type'];
