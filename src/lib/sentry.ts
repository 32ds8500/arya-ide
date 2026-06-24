import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

let initialized = false;

export function initSentry() {
  if (initialized) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    release: process.env.APP_VERSION ?? "unknown",
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    beforeSend(event: any) {
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
  });

  initialized = true;
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(message, level);
}

export function startTransaction(name: string, op?: string) {
  return Sentry.startTransaction({ name, op: op ?? "task" });
}

export function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: "info",
  });
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

export function flushSentry(timeout: number = 2000) {
  return Sentry.flush(timeout);
}

export { Sentry };
