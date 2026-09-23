import { createLogger, format, transports, type LoggerOptions } from 'winston';

const supportedLevels = new Set(['error', 'warn', 'info', 'debug']);
const configuredLevel = process.env.LOG_LEVEL ?? 'info';

export function createApplicationLogger(
  transport: NonNullable<LoggerOptions['transports']> = new transports.Console({
    forceConsole: true,
  }),
) {
  const writer = createLogger({
    level: supportedLevels.has(configuredLevel) ? configuredLevel : 'info',
    defaultMeta: { service: 'leve-saude-api' },
    format: format.combine(format.timestamp(), format.json()),
    transports: transport,
  });

  return {
    requestCompleted(
      route: string,
      statusCode: number | null,
      durationMs: number,
    ): void {
      const level =
        statusCode === null || statusCode >= 500
          ? 'error'
          : statusCode >= 400
            ? 'warn'
            : 'info';

      writer.log(level, 'http.request.completed', {
        route,
        statusCode,
        durationMs,
      });
    },

    operationFailed(operation: string, error: unknown): void {
      writer.error('operation.failed', {
        operation,
        errorType: error instanceof Error ? error.name : typeof error,
      });
    },

    externalServiceFailed(
      service: string,
      statusCode: number,
      errorCode?: string,
    ): void {
      writer.error('external.service.failed', {
        externalService: service,
        upstreamStatusCode: statusCode,
        errorCode,
      });
    },
  };
}

export const logger = createApplicationLogger();
