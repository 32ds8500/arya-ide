export { RuntimeEngine } from './runtime-engine';
export { JobQueue } from './job-queue';
export * from './types';

import { RuntimeEngine } from './runtime-engine';
import { RuntimeConfig } from './types';

let defaultEngine: RuntimeEngine | null = null;

export function getRuntimeEngine(config?: Partial<RuntimeConfig>): RuntimeEngine {
  if (!defaultEngine) {
    defaultEngine = new RuntimeEngine(config);
  }
  return defaultEngine;
}
