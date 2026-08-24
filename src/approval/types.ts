export interface ApprovalRequest {
  id: string;
  taskId: string;
  tool: string;
  args: Record<string, unknown>;
  risk: 'low' | 'medium' | 'high';
  reason: string;
  requestedAt: number;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  respondedAt?: number;
  response?: string;
}

export interface ApprovalPolicy {
  defaultForLow: 'auto' | 'ask';
  defaultForMedium: 'ask' | 'deny';
  defaultForHigh: 'deny';
  domains: Record<string, 'auto' | 'ask' | 'deny'>;
}
