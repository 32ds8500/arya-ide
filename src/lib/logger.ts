import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "token", "secret"],
    censor: "[REDACTED]",
  },
});

export function createChildLogger(name: string, context?: Record<string, unknown>) {
  return logger.child({ module: name, ...context });
}

export function createRequestLogger(reqId: string) {
  return logger.child({ reqId });
}

export function logError(error: Error, context?: Record<string, unknown>) {
  logger.error({ err: error, ...context }, error.message);
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  logger.info(context, message);
}

export function logWarn(message: string, context?: Record<string, unknown>) {
  logger.warn(context, message);
}

export function logDebug(message: string, context?: Record<string, unknown>) {
  logger.debug(context, message);
}

export default logger;
