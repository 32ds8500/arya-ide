export type AgentType = 'planner' | 'builder' | 'reviewer' | 'researcher' | 'memory';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export interface AgentConfig {
  id: string;
  type: AgentType;
  name: string;
  systemPrompt: string;
  tools: string[];
  maxSteps: number;
  model: string;
  provider: string;
}

export interface AgentState {
  id: string;
  type: AgentType;
  status: AgentStatus;
  steps: AgentStep[];
  result: string | null;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface AgentStep {
  id: number;
  type: 'thought' | 'action' | 'observation' | 'response';
  content: string;
  tool?: string;
  toolInput?: Record<string, any>;
  toolOutput?: string;
  timestamp: Date;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  agentId: string;
  timestamp: Date;
}

export interface TaskPlan {
  id: string;
  goal: string;
  tasks: TaskNode[];
  milestones: Milestone[];
  checkpoints: Checkpoint[];
  createdAt: Date;
}

export interface TaskNode {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  status: TaskStatus;
  subtasks: TaskNode[];
  assignedAgent?: AgentType;
  result?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';

export interface Milestone {
  id: string;
  name: string;
  tasks: string[];
  completed: boolean;
}

export interface Checkpoint {
  id: string;
  taskId: string;
  state: string;
  timestamp: Date;
}

export interface ReviewFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  file?: string;
  line?: number;
  message: string;
  suggestion?: string;
}
