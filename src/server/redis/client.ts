import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<"OK" | string | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
  getDriverType(): "upstash" | "ioredis" | "mock";
}

// 1. In-Memory Mock Fallback for local development
class MockRedisClient implements RedisClient {
  private store = new Map<string, { value: string; expiry?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiry && Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    console.log(`[Redis Mock] GET key="${key}" -> "${entry.value}"`);
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<"OK"> {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiry });
    console.log(`[Redis Mock] SET key="${key}" value="${value}"${ttlSeconds ? ` TTL=${ttlSeconds}s` : ""}`);
    return "OK";
  }

  async incr(key: string): Promise<number> {
    const currentStr = await this.get(key);
    let val = currentStr ? parseInt(currentStr, 10) : 0;
    if (isNaN(val)) val = 0;
    val += 1;
    await this.set(key, val.toString());
    console.log(`[Redis Mock] INCR key="${key}" -> new_val=${val}`);
    return val;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiry = Date.now() + seconds * 1000;
    this.store.set(key, entry);
    console.log(`[Redis Mock] EXPIRE key="${key}" seconds=${seconds}`);
    return 1;
  }

  async del(key: string): Promise<number> {
    const exists = this.store.has(key);
    this.store.delete(key);
    console.log(`[Redis Mock] DEL key="${key}" -> status=${exists ? 1 : 0}`);
    return exists ? 1 : 0;
  }

  getDriverType(): "mock" {
    return "mock";
  }
}

// 2. Standard Redis Client via ioredis
class IoRedisClient implements RedisClient {
  private client: Redis;

  constructor(url: string) {
    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });
    this.client.on("error", (err) => {
      console.warn("[Redis ioredis Warn] Could not connect to Redis server. Operating in fallback state:", err.message);
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err) {
      console.error("[Redis ioredis GET Error]", err);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<"OK" | null> {
    try {
      if (ttlSeconds) {
        return await this.client.set(key, value, "EX", ttlSeconds);
      }
      return await this.client.set(key, value);
    } catch (err) {
      console.error("[Redis ioredis SET Error]", err);
      return null;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (err) {
      console.error("[Redis ioredis INCR Error]", err);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    try {
      return await this.client.expire(key, seconds);
    } catch (err) {
      console.error("[Redis ioredis EXPIRE Error]", err);
      return 0;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (err) {
      console.error("[Redis ioredis DEL Error]", err);
      return 0;
    }
  }

  getDriverType(): "ioredis" {
    return "ioredis";
  }
}

// 3. Upstash Edge-compatible HTTP Redis client
class UpstashRedisClient implements RedisClient {
  private client: UpstashRedis;

  constructor(url: string, token: string) {
    this.client = new UpstashRedis({ url, token });
  }

  async get(key: string): Promise<string | null> {
    try {
      const val = await this.client.get<any>(key);
      if (val === null || val === undefined) return null;
      return typeof val === "string" ? val : JSON.stringify(val);
    } catch (err) {
      console.error("[Redis Upstash GET Error]", err);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<string | null> {
    try {
      if (ttlSeconds) {
        return await this.client.set(key, value, { ex: ttlSeconds });
      }
      return await this.client.set(key, value);
    } catch (err) {
      console.error("[Redis Upstash SET Error]", err);
      return null;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (err) {
      console.error("[Redis Upstash INCR Error]", err);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    try {
      return await this.client.expire(key, seconds);
    } catch (err) {
      console.error("[Redis Upstash EXPIRE Error]", err);
      return 0;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (err) {
      console.error("[Redis Upstash DEL Error]", err);
      return 0;
    }
  }

  getDriverType(): "upstash" {
    return "upstash";
  }
}

// Singleton global manager
let redisInstance: RedisClient | null = null;

export function getRedisClient(): RedisClient {
  if (redisInstance) return redisInstance;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const redisUrl = process.env.REDIS_URL;

  if (upstashUrl && upstashToken) {
    console.log("[Redis] Initializing serverless Upstash REST client.");
    redisInstance = new UpstashRedisClient(upstashUrl, upstashToken);
  } else if (redisUrl) {
    console.log("[Redis] Initializing ioredis standard client.");
    redisInstance = new IoRedisClient(redisUrl);
  } else {
    if (process.env.NODE_ENV === "development") {
      console.log("[Redis] No connection parameters found. Using In-Memory Mock client.");
    }
    redisInstance = new MockRedisClient();
  }

  return redisInstance;
}
