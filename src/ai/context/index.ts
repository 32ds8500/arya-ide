export { ContextManager } from './context-manager';
export * from './types';

import { ContextManager } from './context-manager';

export function createContextManager(maxTokens: number = 8192): ContextManager {
  return new ContextManager({ maxTokens });
}
