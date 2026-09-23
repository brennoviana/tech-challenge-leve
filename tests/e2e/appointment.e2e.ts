const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000/dev';
const apiKey = process.env.DEMO_API_KEY ?? '';

describe('Appointment API over HTTP', () => {
  beforeAll(() => {
    if (!apiKey) {
      throw new Error('Defina DEMO_API_KEY com a chave exibida pelo servidor.');
    }
  });

  it.each([
    ['GET', '/agendas'],
    ['POST', '/agendamento'],
    ['POST', '/triagem'],
  ])('rejects %s %s without an API key', async (method, path) => {
    const response = await fetch(`${baseUrl}${path}`, { method });

    expect(response.status).toBe(403);
  });

  it('lists doctors and available slots on GET /agendas', async () => {
    const response = await fetch(`${baseUrl}/agendas`, {
      headers: { 'x-api-key': apiKey },
    });
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(body).toEqual({
      medicos: [
        {
          id: 1,
          nome: 'Dr. João Silva',
          especialidade: 'Cardiologista',
          horarios_disponiveis: [
            '2026-06-10 09:00',
            '2026-06-10 10:00',
            '2026-06-10 11:00',
          ],
        },
        {
          id: 2,
          nome: 'Dra. Maria Souza',
          especialidade: 'Dermatologista',
          horarios_disponiveis: ['2026-06-11 14:00', '2026-06-11 15:00'],
        },
      ],
    });
  });

  it('creates an appointment and rejects a repeated booking', async () => {
    const payload = JSON.stringify({
      agendamento: {
        medico_id: 1,
        paciente: 'Carlos Almeida',
        data_horario: '2026-06-10 09:00',
      },
    });
    const send = () =>
      fetch(`${baseUrl}/agendamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: payload,
      });

    const created = await send();
    const createdBody: unknown = await created.json();

    expect(created.status).toBe(201);
    expect(createdBody).toEqual({
      mensagem: 'Agendamento realizado com sucesso',
      agendamento: {
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
        medico: 'Dr. João Silva',
        paciente: 'Carlos Almeida',
        data_horario: '2026-06-10 09:00',
      },
    });

    const repeated = await send();
    const repeatedBody: unknown = await repeated.json();

    expect(repeated.status).toBe(409);
    expect(repeatedBody).toEqual({
      erro: 'Horário indisponível',
      mensagem:
        'O horário solicitado não está mais disponível para este médico.',
    });
  });

  it('rejects an invalid payload on POST /agendamento', async () => {
    const response = await fetch(`${baseUrl}/agendamento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: '{}',
    });
    const body: unknown = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      erro: 'Payload inválido',
      mensagem:
        'Informe agendamento com medico_id, paciente e data_horario válidos.',
    });
  });
});
