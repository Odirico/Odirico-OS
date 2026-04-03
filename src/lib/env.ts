import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  SENTRY_DSN: z.string().url().optional(),
});
const allowedOriginsSchema = z.string().min(1);

type PublicEnv = z.infer<typeof publicSchema>;
type ServerEnv = z.infer<typeof serverSchema>;

let cachedPublicEnv: PublicEnv | null = null;
let cachedServerEnv: ServerEnv | null = null;
let cachedAllowedOrigins: string[] | null = null;

export function getPublicEnv() {
  if (cachedPublicEnv) return cachedPublicEnv;

  cachedPublicEnv = publicSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  return cachedPublicEnv;
}

export function getServerEnv() {
  if (cachedServerEnv) return cachedServerEnv;

  cachedServerEnv = serverSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SENTRY_DSN: process.env.SENTRY_DSN,
  });

  return cachedServerEnv;
}

export function getAllowedOrigins() {
  if (cachedAllowedOrigins) return cachedAllowedOrigins;

  // Default CORS to the app URL so missing API-only config does not break page builds.
  cachedAllowedOrigins = allowedOriginsSchema
    .parse(process.env.ALLOWED_ORIGINS ?? getPublicEnv().NEXT_PUBLIC_APP_URL)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return cachedAllowedOrigins;
}
