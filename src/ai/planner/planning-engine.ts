import { Plan, TaskNode, Milestone, Checkpoint, RollbackPoint, PlanStatus, NodeStatus, DependencyGraph, PlanTaskInput } from './types';
import { nanoid } from 'nanoid';

export class PlanningEngine {
  private plans: Map<string, Plan> = new Map();

  createPlan(name: string, goal: string, tasks: PlanTaskInput[]): Plan {
    const buildTask = (t: PlanTaskInput): TaskNode => ({
      id: `task_${nanoid(8)}`,
      title: t.title,
      description: t.description || '',
      status: 'pending' as NodeStatus,
      dependencies: t.dependencies || [],
      subtasks: (t.subtasks || []).map(st => ({
        id: `task_${nanoid(8)}`,
        title: st.title,
        description: st.description || '',
        status: 'pending' as NodeStatus,
        dependencies: st.dependencies || [],
        subtasks: [],
        assignedAgent: st.assignedAgent,
        estimatedDuration: st.estimatedDuration,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      assignedAgent: t.assignedAgent,
      estimatedDuration: t.estimatedDuration,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const plan: Plan = {
      id: `plan_${nanoid(10)}`,
      name,
      goal,
      status: 'draft',
      tasks: tasks.map(buildTask),
      milestones: [],
      checkpoints: [],
      rollbackPoints: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.plans.set(plan.id, plan);
    return plan;
  }

  getPlan(id: string): Plan | undefined {
    return this.plans.get(id);
  }

  listPlans(status?: PlanStatus): Plan[] {
    return Array.from(this.plans.values()).filter(p => !status || p.status === status);
  }

  startPlan(id: string): boolean {
    const plan = this.plans.get(id);
    if (!plan) return false;
    plan.status = 'active';
    plan.updatedAt = new Date();
    return true;
  }

  updateTaskStatus(planId: string, taskId: string, status: NodeStatus, result?: string, error?: string): boolean {
    const plan = this.plans.get(planId);
    if (!plan) return false;

    const task = this.findTask(plan.tasks, taskId);
    if (!task) return false;

    task.status = status;
    if (result !== undefined) task.result = result;
    if (error !== undefined) task.error = error;
    task.updatedAt = new Date();

    if (status === 'completed' || status === 'failed') {
      task.actualDuration = Date.now() - task.createdAt.getTime();
    }

    this.checkMilestones(plan);
    this.checkPlanCompletion(plan);

    plan.updatedAt = new Date();
    return true;
  }

  addMilestone(planId: string, name: string, description: string, taskIds: string[]): Milestone | null {
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const milestone: Milestone = {
      id: `ms_${nanoid(8)}`,
      name,
      description,
      taskIds,
      completed: false
    };

    plan.milestones.push(milestone);
    plan.updatedAt = new Date();
    return milestone;
  }

  createCheckpoint(planId: string, taskId: string, state: string, data: Record<string, any> = {}): Checkpoint | null {
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const checkpoint: Checkpoint = {
      id: `cp_${nanoid(8)}`,
      planId,
      taskId,
      state,
      data,
      timestamp: new Date()
    };

    plan.checkpoints.push(checkpoint);

    const rollbackPoint: RollbackPoint = {
      id: `rb_${nanoid(8)}`,
      checkpointId: checkpoint.id,
      description: `Checkpoint: ${taskId} - ${state}`,
      timestamp: new Date()
    };
    plan.rollbackPoints.push(rollbackPoint);

    plan.updatedAt = new Date();
    return checkpoint;
  }

  rollback(planId: string, rollbackPointId: string): boolean {
    const plan = this.plans.get(planId);
    if (!plan) return false;

    const rollbackPoint = plan.rollbackPoints.find(r => r.id === rollbackPointId);
    if (!rollbackPoint) return false;

    const checkpoint = plan.checkpoints.find(c => c.id === rollbackPoint.checkpointId);
    if (!checkpoint) return false;

    for (const task of plan.tasks) {
      this.resetTaskFromCheckpoint(task, checkpoint.taskId, checkpoint.state);
    }

    plan.updatedAt = new Date();
    return true;
  }

  buildDependencyGraph(planId: string): DependencyGraph | null {
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const nodes: string[] = [];
    const edges: Array<{ from: string; to: string }> = [];

    this.collectNodesAndEdges(plan.tasks, nodes, edges);

    const sorted = this.topologicalSort(nodes, edges);
    const cycles = this.detectCycles(nodes, edges);

    return { nodes, edges, sorted, cycles };
  }

  getReadyTasks(planId: string): TaskNode[] {
    const plan = this.plans.get(planId);
    if (!plan) return [];

    const ready: TaskNode[] = [];
    for (const task of plan.tasks) {
      if (task.status !== 'pending') continue;
      const depsComplete = task.dependencies.every(depId => {
        const dep = this.findTask(plan.tasks, depId);
        return dep && dep.status === 'completed';
      });
      if (depsComplete) ready.push(task);
    }
    return ready;
  }

  deletePlan(id: string): boolean {
    return this.plans.delete(id);
  }

  private findTask(tasks: TaskNode[], id: string): TaskNode | undefined {
    for (const task of tasks) {
      if (task.id === id) return task;
      const found = this.findTask(task.subtasks, id);
      if (found) return found;
    }
    return undefined;
  }

  private collectNodesAndEdges(tasks: TaskNode[], nodes: string[], edges: Array<{ from: string; to: string }>): void {
    for (const task of tasks) {
      nodes.push(task.id);
      for (const dep of task.dependencies) {
        edges.push({ from: dep, to: task.id });
      }
      this.collectNodesAndEdges(task.subtasks, nodes, edges);
    }
  }

  private topologicalSort(nodes: string[], edges: Array<{ from: string; to: string }>): string[] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node, 0);
      adjList.set(node, []);
    }

    for (const edge of edges) {
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
      adjList.get(edge.from)?.push(edge.to);
    }

    const queue = nodes.filter(n => (inDegree.get(n) || 0) === 0);
    const sorted: string[] = [];

    while (queue.length > 0) {
      const node = queue.shift()!;
      sorted.push(node);

      for (const neighbor of adjList.get(node) || []) {
        const newDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    return sorted;
  }

  private detectCycles(nodes: string[], edges: Array<{ from: string; to: string }>): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const adjList = new Map<string, string[]>();

    for (const node of nodes) adjList.set(node, []);
    for (const edge of edges) adjList.get(edge.from)?.push(edge.to);

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      for (const neighbor of adjList.get(node) || []) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart >= 0) {
            cycles.push(path.slice(cycleStart));
          }
        }
      }

      recStack.delete(node);
    };

    for (const node of nodes) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  private checkMilestones(plan: Plan): void {
    for (const milestone of plan.milestones) {
      if (milestone.completed) continue;
      const allComplete = milestone.taskIds.every(taskId => {
        const task = this.findTask(plan.tasks, taskId);
        return task && task.status === 'completed';
      });
      if (allComplete) {
        milestone.completed = true;
        milestone.completedAt = new Date();
      }
    }
  }

  private checkPlanCompletion(plan: Plan): void {
    const allTasks = this.getAllTasks(plan.tasks);
    const allComplete = allTasks.every(t => t.status === 'completed' || t.status === 'skipped');
    const anyFailed = allTasks.some(t => t.status === 'failed');

    if (allComplete) {
      plan.status = 'completed';
      plan.completedAt = new Date();
    } else if (anyFailed) {
      plan.status = 'failed';
    }
  }

  private getAllTasks(tasks: TaskNode[]): TaskNode[] {
    const result: TaskNode[] = [];
    for (const task of tasks) {
      result.push(task);
      result.push(...this.getAllTasks(task.subtasks));
    }
    return result;
  }

  private resetTaskFromCheckpoint(task: TaskNode, checkpointTaskId: string, state: string): void {
    if (task.id === checkpointTaskId) {
      task.status = 'pending';
      task.result = undefined;
      task.error = undefined;
      task.updatedAt = new Date();
    }
    for (const subtask of task.subtasks) {
      this.resetTaskFromCheckpoint(subtask, checkpointTaskId, state);
    }
  }
}
