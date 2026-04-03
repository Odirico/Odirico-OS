type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, event: string, context?: Record<string, unknown>) {
  const payload = {
    level,
    event,
    context,
    timestamp: new Date().toISOString(),
  };

  const message = JSON.stringify(payload);

  if (level === "error") {
    console.error(message);
    return;
  }

  if (level === "warn") {
    console.warn(message);
    return;
  }

  console.info(message);
}

export function logInfo(event: string, context?: Record<string, unknown>) {
  log("info", event, context);
}

export function logWarn(event: string, context?: Record<string, unknown>) {
  log("warn", event, context);
}

export function logError(event: string, context?: Record<string, unknown>) {
  log("error", event, context);
}
