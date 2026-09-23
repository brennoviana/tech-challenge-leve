import { TriageUnavailableError } from '../../src/features/triage/application/errors';
import { TriageHandler } from '../../src/features/triage/infra/http/handler';

const payload = JSON.stringify({
  sintomas: 'Sinto dor de cabeça há dois dias',
});

describe('POST /triagem', () => {
  it('returns the triage assessment without exposing provider details', async () => {
    const execute = jest.fn().mockResolvedValue({
      assessment: {
        priority: 'avaliacao_breve',
        suggestedSpecialty: 'Clínica geral',
        guidance: 'Procure avaliação profissional.',
      },
      notice: 'Esta orientação não substitui avaliação médica.',
    });
    const handler = new TriageHandler({ execute });

    const response = await handler.handle({ body: payload });

    expect(execute).toHaveBeenCalledWith({
      symptoms: 'Sinto dor de cabeça há dois dias',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      triagem: {
        prioridade: 'avaliacao_breve',
        especialidade_sugerida: 'Clínica geral',
        orientacao: 'Procure avaliação profissional.',
      },
      aviso: 'Esta orientação não substitui avaliação médica.',
    });
  });

  it.each([
    null,
    '{',
    '{}',
    JSON.stringify({ sintomas: '  ' }),
    JSON.stringify({ sintomas: 42 }),
    JSON.stringify({ sintomas: 'a'.repeat(1001) }),
    JSON.stringify({ sintomas: 'Tosse', extra: 'não esperado' }),
  ])(
    'returns 400 before calling the advisor for invalid input',
    async (body) => {
      const execute = jest.fn();
      const handler = new TriageHandler({ execute });

      const response = await handler.handle({ body });

      expect(response.statusCode).toBe(400);
      expect(execute).not.toHaveBeenCalled();
    },
  );

  it('returns 503 when the advisor is unavailable', async () => {
    const handler = new TriageHandler({
      execute: async () => {
        throw new TriageUnavailableError();
      },
    });

    const response = await handler.handle({ body: payload });

    expect(response.statusCode).toBe(503);
    expect(response.body).not.toContain('OpenAI');
  });

  it('returns 500 without logging symptoms for an unexpected error', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation();
    const handler = new TriageHandler({
      execute: async () => {
        throw new Error('sensitive details');
      },
    });

    try {
      const response = await handler.handle({ body: payload });

      expect(response.statusCode).toBe(500);
      expect(response.body).not.toContain('sensitive details');
      expect(log).toHaveBeenCalledWith('Failed to perform triage');
    } finally {
      log.mockRestore();
    }
  });
});
