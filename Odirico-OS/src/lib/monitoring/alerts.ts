import { logError } from "@/lib/monitoring/logger";

export async function sendOperationalAlert(
  name: string,
  context: Record<string, unknown>,
) {
  logError(`alert.${name}`, context);

  // Replace this with a real Slack, email, PagerDuty, or Sentry alert hook.
  return { delivered: false, name };
}
