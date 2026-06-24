export type PlanStatus = 'draft' | 'active' | 'completed' | 'failed' | 'cancelled';

export type NodeStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked' | 'skipped';

export interface Plan {
  id: string;
  name: string;
  goal: string;
  status: PlanStatus;
  tasks: TaskNode[];
  milestones: Milestone[];
  checkpoints: Checkpoint[];
  rollbackPoints: RollbackPoint[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TaskNode {
  id: string;
  title: string;
  description: string;
  status: NodeStatus;
  dependencies: string[];
  subtasks: TaskNode[];
  assignedAgent?: string;
  result?: string;
  error?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  taskIds: string[];
  completed: boolean;
  completedAt?: Date;
}

export interface Checkpoint {
  id: string;
  planId: string;
  taskId: string;
  state: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface RollbackPoint {
  id: string;
  checkpointId: string;
  description: string;
  timestamp: Date;
}

export interface DependencyGraph {
  nodes: string[];
  edges: Array<{ from: string; to: string }>;
  sorted: string[];
  cycles: string[][];
}

export interface PlanTaskInput {
  title: string;
  description?: string;
  dependencies?: string[];
  subtasks?: PlanTaskInput[];
  assignedAgent?: string;
  estimatedDuration?: number;
}
