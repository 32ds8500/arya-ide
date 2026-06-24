declare module '@redis/client' {
  export interface RedisClientOptions {
    url?: string;
    socket?: { host?: string; port?: number; password?: string };
  }
  export function createClient(options?: RedisClientOptions): RedisClient;
  export interface RedisClient {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    del(key: string): Promise<void>;
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<void>;
    on(event: string, listener: (...args: any[]) => void): this;
  }
}
