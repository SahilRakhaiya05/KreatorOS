import { getRedisClient } from "./client";

/**
 * Retrieves a cached item from Redis, parsing it from JSON back into its type T.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`[Redis Cache GET Error] for key="${key}":`, err);
    return null;
  }
}

/**
 * Saves an item of type T to Redis as JSON, applying a Time-To-Live (TTL) in seconds.
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
  const redis = getRedisClient();
  try {
    const dataStr = JSON.stringify(value);
    await redis.set(key, dataStr, ttlSeconds);
  } catch (err) {
    console.error(`[Redis Cache SET Error] for key="${key}":`, err);
  }
}

/**
 * Deletes a cached item from Redis.
 */
export async function cacheDel(key: string): Promise<void> {
  const redis = getRedisClient();
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`[Redis Cache DEL Error] for key="${key}":`, err);
  }
}
