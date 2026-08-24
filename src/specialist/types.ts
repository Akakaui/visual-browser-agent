export type SpecialistMode =
  | 'observe'
  | 'website-study'
  | 'responsive-audit'
  | 'animation-study'
  | 'visual-regression'
  | 'accessibility-visual'
  | 'visual-debug'
  | 'workflow-observe'
  | 'public-research'
  | 'lead-research'
  | 'social-draft'
  | 'monitor';

export interface EvidenceRef {
  type: 'screenshot' | 'clip' | 'frame' | 'trace';
  path: string;
  timestamp?: number;
}

export interface Finding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  claim: string;
  confidence: number;
  evidence: EvidenceRef[];
  recommendedAction?: string;
}

export interface SpecialistTaskRequest {
  taskId: string;
  objective: string;
  startUrl?: string;
  allowedDomains: string[];
  mode: SpecialistMode;
  requirements: string[];
  humanPolicy: {
    allowTakeover: boolean;
    requireApprovalForPublicActions: boolean;
  };
  retention: {
    rawVideo: 'temporary' | 'keep' | number;
    report: 'temporary' | 'keep' | number;
  };
}

export interface HumanEventRecord {
  timestamp: number;
  kind: 'ask_human' | 'approval' | 'takeover';
  question: string;
  outcome: 'answered' | 'approved' | 'rejected' | 'timeout' | 'pending';
}

export interface SpecialistTaskResponse {
  taskId: string;
  status: 'completed' | 'partial' | 'blocked' | 'needs_human';
  summary: string;
  findings: Finding[];
  artifacts: {
    report?: string;
    manifest?: string;
    keptEvidence: string[];
  };
  humanEvents: HumanEventRecord[];
  limitations: string[];
}

export interface PlannerStep {
  id: string;
  name: string;
  description: string;
  optional: boolean;
}