import { TriageUnavailableError } from '../../src/features/triage/application/errors';
import { OpenAiTriageAdvisor } from '../../src/features/triage/infra/llm/openai-triage-advisor';
import { logger } from '../../src/shared/infra/logging/logger';

const assessment = {
  prioridade: 'consulta_eletiva',
  especialidade_sugerida: 'Dermatologia',
  orientacao: 'Procure um profissional de saúde.',
};

function apiResponse(content: unknown, status = 'completed'): Response {
  return new Response(
    JSON.stringify({
      status,
      output: [{ type: 'message', content }],
    }),
    { status: 200 },
  );
}

describe('OpenAiTriageAdvisor', () => {
  it('sends a bounded, stateless structured request and parses the assessment', async () => {
    const httpClient = jest
      .fn()
      .mockResolvedValue(
        apiResponse([
          { type: 'output_text', text: JSON.stringify(assessment) },
        ]),
      );
    const advisor = new OpenAiTriageAdvisor(
      { apiKey: 'test-key', model: 'gpt-4o-mini' },
      httpClient,
    );

    await expect(advisor.assess('Manchas na pele')).resolves.toEqual({
      priority: 'consulta_eletiva',
      suggestedSpecialty: 'Dermatologia',
      guidance: 'Procure um profissional de saúde.',
    });

    const [url, init] = httpClient.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;

    expect(url).toBe('https://api.openai.com/v1/responses');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer test-key' });
    expect(body).toMatchObject({
      model: 'gpt-4o-mini',
      input: 'Manchas na pele',
      store: false,
      text: {
        format: {
          type: 'json_schema',
          strict: true,
          schema: {
            required: ['prioridade', 'especialidade_sugerida', 'orientacao'],
          },
        },
      },
    });
    expect(init.signal).toBeDefined();
  });

  it('fails without a key before sending symptoms', async () => {
    const httpClient = jest.fn();
    const advisor = new OpenAiTriageAdvisor(
      { apiKey: undefined, model: 'gpt-4o-mini' },
      httpClient,
    );

    await expect(advisor.assess('Manchas na pele')).rejects.toBeInstanceOf(
      TriageUnavailableError,
    );
    expect(httpClient).not.toHaveBeenCalled();
  });

  it('logs only a safe provider code for a billing failure', async () => {
    const log = jest
      .spyOn(logger, 'externalServiceFailed')
      .mockImplementation();
    const response = new Response(
      JSON.stringify({
        error: {
          code: 'credit_balance_exhausted',
          message: 'sensitive provider details',
        },
      }),
      { status: 429 },
    );
    const advisor = new OpenAiTriageAdvisor(
      { apiKey: 'test-key', model: 'gpt-4o-mini' },
      async () => response,
    );

    try {
      await expect(advisor.assess('Manchas na pele')).rejects.toBeInstanceOf(
        TriageUnavailableError,
      );
      expect(log).toHaveBeenCalledWith(
        'openai',
        429,
        'credit_balance_exhausted',
      );
      expect(JSON.stringify(log.mock.calls)).not.toContain('sensitive');
    } finally {
      log.mockRestore();
    }
  });

  it.each([
    new Response('', { status: 429 }),
    apiResponse([{ type: 'refusal', refusal: 'Cannot assist' }]),
    apiResponse(
      [{ type: 'output_text', text: JSON.stringify(assessment) }],
      'incomplete',
    ),
    apiResponse([{ type: 'output_text', text: '{' }]),
    apiResponse([
      {
        type: 'output_text',
        text: JSON.stringify({ ...assessment, prioridade: 'invalid' }),
      },
    ]),
  ])(
    'rejects unavailable, refused, incomplete or malformed output',
    async (response) => {
      const advisor = new OpenAiTriageAdvisor(
        { apiKey: 'test-key', model: 'gpt-4o-mini' },
        async () => response,
      );

      await expect(advisor.assess('Manchas na pele')).rejects.toBeInstanceOf(
        TriageUnavailableError,
      );
    },
  );

  it('turns network failures into an availability error', async () => {
    const advisor = new OpenAiTriageAdvisor(
      { apiKey: 'test-key', model: 'gpt-4o-mini' },
      async () => {
        throw new Error('network details');
      },
    );

    await expect(advisor.assess('Manchas na pele')).rejects.toBeInstanceOf(
      TriageUnavailableError,
    );
  });
});
