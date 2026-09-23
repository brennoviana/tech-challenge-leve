const baseUrl =
  process.env.E2E_BASE_URL ??
  `http://localhost:${process.env.HTTP_PORT ?? '3000'}/dev`;
const apiKey = process.env.DEMO_API_KEY ?? '';

interface SchedulesResponse {
  medicos: Array<{
    id: number;
    nome: string;
    especialidade: string;
    horarios_disponiveis: string[];
  }>;
}

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
    const body = (await response.json()) as SchedulesResponse;

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(body).toEqual({
      medicos: [
        {
          id: 1,
          nome: 'Dr. João Silva',
          especialidade: 'Cardiologista',
          horarios_disponiveis: [
            expect.stringMatching(/^\d{4}-\d{2}-\d{2} 09:00$/),
            expect.stringMatching(/^\d{4}-\d{2}-\d{2} 10:00$/),
            expect.stringMatching(/^\d{4}-\d{2}-\d{2} 11:00$/),
          ],
        },
        {
          id: 2,
          nome: 'Dra. Maria Souza',
          especialidade: 'Dermatologista',
          horarios_disponiveis: [
            expect.stringMatching(/^\d{4}-\d{2}-\d{2} 14:00$/),
            expect.stringMatching(/^\d{4}-\d{2}-\d{2} 15:00$/),
          ],
        },
      ],
    });
  });

  it('creates an appointment and rejects a repeated booking', async () => {
    const schedulesResponse = await fetch(`${baseUrl}/agendas`, {
      headers: { 'x-api-key': apiKey },
    });
    expect(schedulesResponse.status).toBe(200);
    const schedules = (await schedulesResponse.json()) as SchedulesResponse;
    const dateTime = schedules.medicos[0]?.horarios_disponiveis[0];

    if (!dateTime) {
      throw new Error('A agenda do primeiro médico não contém horários.');
    }

    const payload = JSON.stringify({
      agendamento: {
        medico_id: 1,
        paciente: 'Carlos Almeida',
        data_horario: dateTime,
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
        data_horario: dateTime,
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
