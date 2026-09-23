import type { HttpResponse } from '../../src/shared/infra/http/json-response';
import { LogRequest } from '../../src/shared/infra/http/log-request';

class SuccessfulHandler {
  constructor(private readonly response: HttpResponse) {}

  @LogRequest('POST /agendamento')
  async handle(request: { body: string }): Promise<HttpResponse> {
    if (!request.body) {
      throw new Error('Missing body');
    }

    return this.response;
  }
}

class FailingHandler {
  constructor(private readonly failure: Error) {}

  @LogRequest('GET /agendas')
  async handle(): Promise<HttpResponse> {
    throw this.failure;
  }
}

describe('@LogRequest', () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'info').mockImplementation();
  });

  afterEach(() => {
    log.mockRestore();
  });

  it('preserves the response and logs route and status', async () => {
    const response = { statusCode: 201, headers: {}, body: '{}' };
    const handler = new SuccessfulHandler(response);

    await expect(handler.handle({ body: 'Carlos Almeida' })).resolves.toBe(
      response,
    );
    expect(log).toHaveBeenCalledWith({
      route: 'POST /agendamento',
      statusCode: 201,
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain('Carlos Almeida');
  });

  it('logs a failure and preserves the original error', async () => {
    const failure = new Error('test failure');
    const handler = new FailingHandler(failure);

    await expect(handler.handle()).rejects.toBe(failure);
    expect(log).toHaveBeenCalledWith({
      route: 'GET /agendas',
      statusCode: null,
    });
  });
});
