import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../src/features/list-schedules/infra/aws/lambda';
import { ListSchedulesHandler } from '../../src/features/list-schedules/infra/http/handler';
import { Doctor } from '../../src/shared/domain/doctor';
import { logger } from '../../src/shared/infra/logging/logger';

describe('GET /agendas', () => {
  it('returns the expected HTTP contract for available doctors', async () => {
    const handler = new ListSchedulesHandler({
      execute: async () => [
        new Doctor(1, 'Dr. João Silva', 'Cardiologista', ['2026-06-10 09:00']),
      ],
    });

    const response = await handler.handle();

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      'Content-Type': 'application/json; charset=utf-8',
    });
    expect(JSON.parse(response.body)).toEqual({
      medicos: [
        {
          id: 1,
          nome: 'Dr. João Silva',
          especialidade: 'Cardiologista',
          horarios_disponiveis: ['2026-06-10 09:00'],
        },
      ],
    });
  });

  it('wires the Lambda to the repository with sample doctors', async () => {
    const response = await handler({} as APIGatewayProxyEvent);
    const body = JSON.parse(response.body) as {
      medicos: Array<{ id: number; horarios_disponiveis: string[] }>;
    };

    expect(response.statusCode).toBe(200);
    expect(body.medicos).toHaveLength(2);
    expect(body.medicos[0]?.horarios_disponiveis[0]).toMatch(
      /^\d{4}-\d{2}-\d{2} 09:00$/,
    );
    expect(body.medicos[1]?.id).toBe(2);
  });

  it('does not expose internal details when the use case fails', async () => {
    const log = jest.spyOn(logger, 'operationFailed').mockImplementation();
    const failingHandler = new ListSchedulesHandler({
      execute: async () => {
        throw new Error('internal details');
      },
    });

    try {
      const response = await failingHandler.handle();

      expect(response.statusCode).toBe(500);
      expect(response.body).not.toContain('internal details');
    } finally {
      log.mockRestore();
    }
  });
});
