export { Subagent } from './subagent';
export { SubagentRegistry } from './registry';
export { Orchestrator } from './orchestrator';
export * from './types';

import { Orchestrator } from './orchestrator';

export const orchestrator = new Orchestrator();
