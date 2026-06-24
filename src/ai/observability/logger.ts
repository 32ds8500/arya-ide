export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
  timestamp: Date;
}

export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'text';
  context?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
};

export class Logger {
  private config: LoggerConfig;
  private entries: LogEntry[] = [];
  private maxEntries: number;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level || 'info',
      format: config.format || 'json',
      context: config.context
    };
    this.maxEntries = 1000;
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data?: any): void {
    this.log('error', message, data, error);
  }

  fatal(message: string, error?: Error, data?: any): void {
    this.log('fatal', message, data, error);
  }

  child(context: string): Logger {
    return new Logger({
      ...this.config,
      context: this.config.context ? `${this.config.context}:${context}` : context
    });
  }

  getEntries(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.entries.filter(e => e.level === level);
    }
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) return;

    const entry: LogEntry = {
      level,
      message,
      context: this.config.context,
      data,
      error,
      timestamp: new Date()
    };

    this.entries.push(entry);

    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    if (typeof console !== 'undefined') {
      const prefix = this.config.context ? `[${this.config.context}]` : '';
      const logFn = level === 'error' || level === 'fatal' ? console.error :
                    level === 'warn' ? console.warn :
                    level === 'debug' ? console.debug : console.log;

      if (this.config.format === 'json') {
        logFn(JSON.stringify(entry));
      } else {
        logFn(`${prefix} ${level.toUpperCase()}: ${message}`, data || '', error || '');
      }
    }
  }
}
