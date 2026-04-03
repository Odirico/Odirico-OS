import { logInfo } from "@/lib/monitoring/logger";
import { getServerEnv } from "@/lib/env";

export async function register() {
  logInfo("app.register", { runtime: process.env.NEXT_RUNTIME ?? "nodejs" });

  const env = getServerEnv();

  if (env.SENTRY_DSN) {
    try {
      const Sentry = await import("@sentry/nextjs");
      Sentry.init({
        dsn: env.SENTRY_DSN,
        tracesSampleRate: 0.1,
      });
    } catch (error) {
      console.error("Failed to initialize Sentry", error);
    }
  }
}

export async function onRequestError(error: Error) {
  logInfo("app.request_error", { message: error.message, digest: (error as Error & { digest?: string }).digest });
}
