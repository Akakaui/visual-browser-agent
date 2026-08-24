import type { SubagentTask, SubagentResult, DelegationPlan } from './types.js';

export class SubagentScheduler {
  private tasks = new Map<string, SubagentTask>();
  private results = new Map<string, SubagentResult>();

  submit(task: SubagentTask): void {
    if (this.tasks.has(task.taskId)) {
      throw new Error(`Task already submitted: ${task.taskId}`);
    }
    for (const depId of task.dependencyIds) {
      if (!this.tasks.has(depId)) {
        throw new Error(`Dependency task not found: ${depId}`);
      }
    }
    this.tasks.set(task.taskId, task);
  }

  getResult(taskId: string): SubagentResult | undefined {
    return this.results.get(taskId);
  }

  getPending(): SubagentTask[] {
    const pending: SubagentTask[] = [];
    for (const task of this.tasks.values()) {
      if (!this.results.has(task.taskId)) {
        pending.push(task);
      }
    }
    return pending;
  }

  getReady(completedIds: string[]): SubagentTask[] {
    const ready: SubagentTask[] = [];
    for (const task of this.tasks.values()) {
      if (this.results.has(task.taskId)) {
        continue;
      }
      const allDepsCompleted = task.dependencyIds.every(
        (depId) => completedIds.includes(depId),
      );
      if (allDepsCompleted) {
        ready.push(task);
      }
    }
    return ready;
  }

  complete(taskId: string, result: SubagentResult): void {
    if (!this.tasks.has(taskId)) {
      throw new Error(`Task not found: ${taskId}`);
    }
    if (result.taskId !== taskId) {
      throw new Error(
        `Result taskId mismatch: expected ${taskId}, got ${result.taskId}`,
      );
    }
    this.results.set(taskId, result);
  }

  cancel(taskId: string): void {
    if (!this.tasks.has(taskId)) {
      throw new Error(`Task not found: ${taskId}`);
    }
    this.tasks.delete(taskId);
    this.results.delete(taskId);
  }

  getPlan(): DelegationPlan {
    const tasks: SubagentTask[] = [];
    for (const task of this.tasks.values()) {
      tasks.push(task);
    }

    const hasDependencies = tasks.some(
      (t) => t.dependencyIds.length > 0,
    );
    const executionMode = hasDependencies ? 'sequential' : 'parallel';

    return {
      executionMode,
      tasks,
      synthesisRules: [],
    };
  }
}

export const subagentScheduler = new SubagentScheduler();
