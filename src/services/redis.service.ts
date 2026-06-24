import Redis from "ioredis";

let client: Redis | null = null;

function getClient(): Redis {
  if (!client) {
    client = new Redis({
      host: process.env.REDIS_HOST ?? "localhost",
      port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
      password: process.env.REDIS_PASSWORD ?? undefined,
      db: parseInt(process.env.REDIS_DB ?? "0", 10),
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: true,
      lazyConnect: true,
    });

    client.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });

    client.on("connect", () => {
      console.log("[Redis] Connected");
    });
  }
  return client;
}

export const redisService = {
  async connect() {
    const c = getClient();
    if (c.status !== "ready") {
      await c.connect();
    }
    return c;
  },

  async disconnect() {
    if (client) {
      await client.quit();
      client = null;
    }
  },

  async get(key: string): Promise<string | null> {
    return getClient().get(key);
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const c = getClient();
    if (ttlSeconds) {
      await c.set(key, value, "EX", ttlSeconds);
    } else {
      await c.set(key, value);
    }
  },

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return getClient().del(...keys);
  },

  async exists(key: string): Promise<boolean> {
    const result = await getClient().exists(key);
    return result === 1;
  },

  async incr(key: string): Promise<number> {
    return getClient().incr(key);
  },

  async incrBy(key: string, amount: number): Promise<number> {
    return getClient().incrby(key, amount);
  },

  async expire(key: string, seconds: number): Promise<void> {
    await getClient().expire(key, seconds);
  },

  async ttl(key: string): Promise<number> {
    return getClient().ttl(key);
  },

  async cache<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    const cached = await this.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const value = await factory();
    await this.set(key, JSON.stringify(value), ttlSeconds);
    return value;
  },

  async invalidatePattern(pattern: string): Promise<number> {
    const c = getClient();
    const keys = await c.keys(pattern);
    if (keys.length === 0) return 0;
    return c.del(...keys);
  },

  async hashGet(key: string, field: string): Promise<string | null> {
    return getClient().hget(key, field);
  },

  async hashSet(key: string, field: string, value: string): Promise<void> {
    await getClient().hset(key, field, value);
  },

  async hashGetAll(key: string): Promise<Record<string, string>> {
    return getClient().hgetall(key);
  },

  async listPush(key: string, ...values: string[]): Promise<number> {
    return getClient().rpush(key, ...values);
  },

  async listRange(key: string, start: number, stop: number): Promise<string[]> {
    return getClient().lrange(key, start, stop);
  },

  async setAdd(key: string, ...members: string[]): Promise<number> {
    return getClient().sadd(key, ...members);
  },

  async setMembers(key: string): Promise<string[]> {
    return getClient().smembers(key);
  },

  async publish(channel: string, message: string): Promise<number> {
    return getClient().publish(channel, message);
  },

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    const subscriber = getClient().duplicate();
    await subscriber.subscribe(channel);
    subscriber.on("message", (_ch, message) => {
      if (_ch === channel) callback(message);
    });
  },
};
