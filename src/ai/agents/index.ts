export { BaseAgent } from './base-agent';
export { PlannerAgent } from './planner-agent';
export { BuilderAgent } from './builder-agent';
export { ReviewerAgent } from './reviewer-agent';
export { ResearchAgent } from './researcher-agent';
export { MemoryAgent } from './memory-agent';
export * from './types';

import { AgentConfig, AgentType } from './types';
import { PlannerAgent } from './planner-agent';
import { BuilderAgent } from './builder-agent';
import { ReviewerAgent } from './reviewer-agent';
import { ResearchAgent } from './researcher-agent';
import { MemoryAgent } from './memory-agent';
import { BaseAgent } from './base-agent';

export function createAgent(type: AgentType, config: Partial<AgentConfig> = {}): BaseAgent {
  switch (type) {
    case 'planner':
      return new PlannerAgent(config);
    case 'builder':
      return new BuilderAgent(config);
    case 'reviewer':
      return new ReviewerAgent(config);
    case 'researcher':
      return new ResearchAgent(config);
    case 'memory':
      return new MemoryAgent(config);
    default:
      throw new Error(`Bilinmeyen agent türü: ${type}`);
  }
}

export function getAgentTypes(): AgentType[] {
  return ['planner', 'builder', 'reviewer', 'researcher', 'memory'];
}
