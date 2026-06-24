declare module '@sentry/node' {
  export namespace SeverityLevel {
    type Level = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
  }
  export function init(options?: any): void;
  export function captureException(e: any, context?: any): string;
  export function captureMessage(message: string, level?: string): string;
  export function withScope(callback: (scope: any) => void): void;
  export function addBreadcrumb(data: any): void;
  export function setUser(user: any): void;
  export function flush(timeout?: number): Promise<boolean>;
  export function startTransaction(data: any): any;
  type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
}
declare module '@sentry/profiling-node' {
  export function nodeProfilingIntegration(): any;
}
