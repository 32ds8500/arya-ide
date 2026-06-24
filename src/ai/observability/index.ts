export { Tracer, tracer } from './tracer';
export type { Span, SpanEvent } from './tracer';
export { MetricsCollector, metrics } from './metrics';
export type { Metric, Counter, Histogram } from './metrics';
export { Logger } from './logger';
export type { LogLevel, LogEntry, LoggerConfig } from './logger';

import { Logger } from './logger';

export function createLogger(context?: string, level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal'): Logger {
  return new Logger({ context, level });
}
