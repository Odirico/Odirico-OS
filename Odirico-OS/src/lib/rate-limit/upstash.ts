import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { getServerEnv } from "@/lib/env";

let cachedRatelimit: Ratelimit | null = null;

function getRatelimit() {
  if (cachedRatelimit) return cachedRatelimit;

  const env = getServerEnv();

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  cachedRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "poleqa",
  });

  return cachedRatelimit;
}

export async function assertRateLimit(
  key: string,
  limitName: string,
) {
  const ratelimit = getRatelimit();
  if (!ratelimit) {
    return { success: true, pending: 0, reset: 0 };
  }

  return ratelimit.limit(`${limitName}:${key}`);
}
