import { eventBus } from '../events/bus.js';
import type { ApprovalRequest, ApprovalPolicy } from './types.js';

export class ApprovalService {
  private requests = new Map<string, ApprovalRequest>();

  async requestApproval(
    tool: string,
    args: Record<string, unknown>,
    risk: 'low' | 'medium' | 'high',
    reason: string,
    taskId: string,
  ): Promise<ApprovalRequest> {
    const id = `approval-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const request: ApprovalRequest = {
      id,
      taskId,
      tool,
      args,
      risk,
      reason,
      requestedAt: Date.now(),
      status: 'pending',
    };

    this.requests.set(id, request);

    eventBus.emit({
      type: 'approval.required',
      timestamp: Date.now(),
      taskId,
      payload: { approvalId: id, tool, risk, reason },
    });

    return request;
  }

  approve(id: string, response?: string): void {
    const request = this.requests.get(id);
    if (!request) {
      throw new Error(`Approval request not found: ${id}`);
    }
    if (request.status !== 'pending') {
      throw new Error(`Approval request ${id} is already ${request.status}`);
    }

    request.status = 'approved';
    request.respondedAt = Date.now();
    request.response = response;
  }

  deny(id: string, response?: string): void {
    const request = this.requests.get(id);
    if (!request) {
      throw new Error(`Approval request not found: ${id}`);
    }
    if (request.status !== 'pending') {
      throw new Error(`Approval request ${id} is already ${request.status}`);
    }

    request.status = 'denied';
    request.respondedAt = Date.now();
    request.response = response;
  }

  getPending(): ApprovalRequest[] {
    const pending: ApprovalRequest[] = [];
    for (const request of this.requests.values()) {
      if (request.status === 'pending') {
        pending.push(request);
      }
    }
    return pending;
  }

  shouldAutoApprove(tool: string, policy: ApprovalPolicy): boolean {
    const domainAction = policy.domains[tool];
    if (domainAction !== undefined) {
      return domainAction === 'auto';
    }
    return false;
  }
}

export const approvalService = new ApprovalService();
