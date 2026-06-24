import Redis from "ioredis";

let client: Redis | null = null;
let subscriber: Redis | null = null;

function createConnection(name?: string): Redis {
  return new Redis({
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
    db: parseInt(process.env.REDIS_DB ?? "0", 10),
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    keyPrefix: process.env.REDIS_PREFIX ?? "arya:",
    retryStrategy(times: number) {
      if (times > 10) {
        console.error(`[Redis:${name}] Max retries reached`);
        return null;
      }
      return Math.min(times * 100, 3000);
    },
  });
}

export function getRedisClient(): Redis {
  if (!client) {
    client = createConnection("main");

    client.on("error", (err) => {
      console.error("[Redis:main] Error:", err.message);
    });

    client.on("connect", () => {
      console.log("[Redis:main] Connected");
    });
  }
  return client;
}

export function getRedisSubscriber(): Redis {
  if (!subscriber) {
    subscriber = createConnection("subscriber");

    subscriber.on("error", (err) => {
      console.error("[Redis:subscriber] Error:", err.message);
    });

    subscriber.on("connect", () => {
      console.log("[Redis:subscriber] Connected");
    });
  }
  return subscriber;
}

export async function connectRedis() {
  const c = getRedisClient();
  if (c.status !== "ready" && c.status !== "connect") {
    await c.connect();
  }
  return c;
}

export async function disconnectRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
  if (subscriber) {
    await subscriber.quit();
    subscriber = null;
  }
}

export { Redis };
