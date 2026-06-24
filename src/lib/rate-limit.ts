import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on("error", (err: Error) => {
      console.error("[Redis] Connection error:", err.message);
    });
  }

  return redisClient;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs?: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const redis = getRedisClient();

    if (redis.status !== "ready") {
      await redis.connect();
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    const resetAt = now + windowMs;

    const pipeline = redis.pipeline();

    pipeline.zremrangebyscore(key, 0, windowStart);

    pipeline.zadd(key, now.toString(), `${now}:${crypto.randomUUID()}`);

    pipeline.zcard(key);

    pipeline.expire(key, Math.ceil(windowMs / 1000));

    const results = await pipeline.exec();

    if (!results) {
      return {
        success: true,
        remaining: limit - 1,
        resetAt,
      };
    }

    const currentCount = (results[2]?.[1] as number) ?? limit;

    if (currentCount > limit) {
      const retryAfterMs = windowMs - (now - windowStart);
      return {
        success: false,
        remaining: 0,
        resetAt,
        retryAfterMs,
      };
    }

    return {
      success: true,
      remaining: Math.max(0, limit - currentCount),
      resetAt,
    };
  } catch (error) {
    console.error("[RateLimit] Error:", error);

    return {
      success: true,
      remaining: limit - 1,
      resetAt: Date.now() + windowMs,
    };
  }
}

export async function slidingWindowRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const redis = getRedisClient();

    if (redis.status !== "ready") {
      await redis.connect();
    }

    const now = Date.now();
    const windowKey = `${key}:sliding`;

    const luaScript = `
      local key = KEYS[1]
      local window = tonumber(ARGV[1])
      local limit = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local windowStart = now - window

      redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)

      local current = redis.call('ZCARD', key)

      if current >= limit then
        return {0, current, now + window}
      end

      redis.call('ZADD', key, now, now .. ':' .. math.random(1000000))
      redis.call('PEXPIRE', key, window)

      return {1, limit - current - 1, now + window}
    `;

    const result = (await redis.eval(
      luaScript,
      1,
      windowKey,
      windowMs.toString(),
      limit.toString(),
      now.toString()
    )) as [number, number, number];

    const [allowed, remaining, resetAt] = result;

    return {
      success: allowed === 1,
      remaining: Math.max(0, remaining),
      resetAt,
      retryAfterMs: allowed === 0 ? resetAt - now : undefined,
    };
  } catch (error) {
    console.error("[SlidingWindowRateLimit] Error:", error);

    return {
      success: true,
      remaining: limit - 1,
      resetAt: Date.now() + windowMs,
    };
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  try {
    const redis = getRedisClient();

    if (redis.status !== "ready") {
      await redis.connect();
    }

    await redis.del(key, `${key}:sliding`);
  } catch (error) {
    console.error("[RateLimit] Reset error:", error);
  }
}

export async function checkRateLimit(
  key: string
): Promise<{ count: number; ttl: number } | null> {
  try {
    const redis = getRedisClient();

    if (redis.status !== "ready") {
      await redis.connect();
    }

    const count = await redis.zcard(key);
    const ttl = await redis.ttl(key);

    return {
      count,
      ttl: ttl * 1000,
    };
  } catch {
    return null;
  }
}
