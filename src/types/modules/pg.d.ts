declare module 'pg' {
  export interface PoolConfig {
    connectionString?: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }
  export class Pool {
    constructor(config?: PoolConfig);
    on(event: string, listener: (...args: any[]) => void): this;
    end(): Promise<void>;
    query(text: string, values?: any[]): Promise<any>;
    connect(): Promise<any>;
  }
  export class Client {
    constructor(config?: PoolConfig);
    connect(): Promise<void>;
    end(): Promise<void>;
    query(text: string, values?: any[]): Promise<any>;
  }
}
