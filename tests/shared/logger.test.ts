import { Writable } from 'node:stream';
import { transports } from 'winston';
import { createApplicationLogger } from '../../src/shared/infra/logging/logger';

function captureLogs() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });

  return {
    lines,
    logger: createApplicationLogger(new transports.Stream({ stream })),
  };
}

describe('logger', () => {
  it('writes a structured request log without request data', () => {
    const { logger, lines } = captureLogs();
    logger.requestCompleted('POST /triagem', 200, 12);

    const record = JSON.parse(lines[0] as string) as Record<string, unknown>;

    expect(record).toMatchObject({
      level: 'info',
      message: 'http.request.completed',
      service: 'leve-saude-api',
      route: 'POST /triagem',
      statusCode: 200,
      durationMs: 12,
    });
    expect(record.timestamp).toEqual(expect.any(String));
    expect(record).not.toHaveProperty('body');
  });

  it('logs only the error type, without its potentially sensitive message', () => {
    const { logger, lines } = captureLogs();
    logger.operationFailed(
      'triage.assess',
      new Error('Paciente Carlos relatou sintomas'),
    );

    const line = lines[0] as string;
    const record = JSON.parse(line) as Record<string, unknown>;

    expect(record).toMatchObject({
      level: 'error',
      message: 'operation.failed',
      operation: 'triage.assess',
      errorType: 'Error',
    });
    expect(line).not.toContain('Carlos');
    expect(line).not.toContain('sintomas');
  });

  it('marks server errors as errors and records safe upstream details', () => {
    const { logger, lines } = captureLogs();

    logger.externalServiceFailed('openai', 429, 'credit_balance_exhausted');
    logger.requestCompleted('POST /triagem', 503, 100);

    expect(JSON.parse(lines[0] as string)).toMatchObject({
      level: 'error',
      message: 'external.service.failed',
      externalService: 'openai',
      upstreamStatusCode: 429,
      errorCode: 'credit_balance_exhausted',
    });
    expect(JSON.parse(lines[1] as string)).toMatchObject({
      level: 'error',
      message: 'http.request.completed',
      route: 'POST /triagem',
      statusCode: 503,
      durationMs: 100,
    });
  });
});
