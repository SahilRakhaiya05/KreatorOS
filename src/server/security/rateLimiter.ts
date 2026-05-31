import { getRedisClient } from "@/server/redis/client";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Sliding window or simple reset window rate limiting via Redis.
 * Useful for keeping high-cost API endpoints (like AI suggestions) protected.
 * 
 * @param key Unique key representing the caller (e.g., user_id or client_ip) combined with action name.
 * @param limit Maximum number of requests allowed in the duration window.
 * @param windowSeconds Window duration in seconds.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const fullKey = `rate_limit:${key}`;

  try {
    const currentVal = await redis.get(fullKey);
    
    if (!currentVal) {
      // First hit: initialize with count=1 and apply expiration window
      await redis.set(fullKey, "1", windowSeconds);
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: Date.now() + windowSeconds * 1000,
      };
    }

    const count = parseInt(currentVal, 10);
    if (isNaN(count)) {
      // Fallback reset if corruption occurs
      await redis.set(fullKey, "1", windowSeconds);
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: Date.now() + windowSeconds * 1000,
      };
    }

    if (count >= limit) {
      console.warn(`[Rate Limiter Blocked] key="${fullKey}" count=${count} >= limit=${limit}`);
      return {
        success: false,
        limit,
        remaining: 0,
        reset: Date.now() + 5000, // Resets soon (approximate check fallback)
      };
    }

    // Increment count
    const newVal = await redis.incr(fullKey);
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - newVal),
      reset: Date.now() + 5000,
    };
  } catch (err) {
    console.error(`[Rate Limiter Error] key="${key}":`, err);
    // Failure-tolerant fail-open policy: Allow the request to proceed if Redis is offline
    return {
      success: true,
      limit,
      remaining: 1,
      reset: Date.now(),
    };
  }
}
