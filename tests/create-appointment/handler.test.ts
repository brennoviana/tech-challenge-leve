import type { APIGatewayProxyEvent } from 'aws-lambda';
import {
  TimeSlotUnavailableError,
  DoctorNotFoundError,
} from '../../src/features/create-appointment/domain/errors';
import { handler } from '../../src/features/create-appointment/infra/aws/lambda';
import { CreateAppointmentHandler } from '../../src/features/create-appointment/infra/http/handler';
import type {
  CreateAppointmentInput,
  CreateAppointmentResult,
} from '../../src/features/create-appointment/application/create-appointment';

const validAppointment = {
  medico_id: 1,
  paciente: 'Carlos Almeida',
  data_horario: '2026-06-10 09:00',
};

const payload = JSON.stringify({ agendamento: validAppointment });

function bodyWithAppointment(fields: Partial<typeof validAppointment>): string {
  return JSON.stringify({ agendamento: { ...validAppointment, ...fields } });
}

describe('POST /agendamento', () => {
  it('returns 201 and the expected contract for a valid reservation', async () => {
    let received: CreateAppointmentInput | undefined;
    const respond = new CreateAppointmentHandler({
      execute: async (input) => {
        received = input;
        return {
          doctorName: 'Dr. João Silva',
          appointment: {
            id: 'test-uuid',
            doctorId: input.doctorId,
            patientName: input.patientName,
            dateTime: input.dateTime,
          },
        };
      },
    });

    const response = await respond.handle({ body: payload });

    expect(received).toEqual({
      doctorId: 1,
      patientName: 'Carlos Almeida',
      dateTime: '2026-06-10 09:00',
    });
    expect(response.statusCode).toBe(201);
    expect(response.headers).toEqual({
      'Content-Type': 'application/json; charset=utf-8',
    });
    expect(JSON.parse(response.body)).toEqual({
      mensagem: 'Agendamento realizado com sucesso',
      agendamento: {
        id: 'test-uuid',
        medico: 'Dr. João Silva',
        paciente: 'Carlos Almeida',
        data_horario: '2026-06-10 09:00',
      },
    });
  });

  it.each([
    { scenario: 'missing body', body: null },
    { scenario: 'malformed JSON', body: '{' },
    { scenario: 'missing appointment', body: JSON.stringify({}) },
    { scenario: 'invalid doctor', body: bodyWithAppointment({ medico_id: 0 }) },
    { scenario: 'blank patient', body: bodyWithAppointment({ paciente: ' ' }) },
    {
      scenario: 'invalid calendar date',
      body: bodyWithAppointment({ data_horario: '2026-02-30 09:00' }),
    },
  ])('returns 400 for $scenario', async ({ body }) => {
    const execute = jest.fn<
      Promise<CreateAppointmentResult>,
      [CreateAppointmentInput]
    >();
    const respond = new CreateAppointmentHandler({ execute });

    const response = await respond.handle({ body });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toMatchObject({
      erro: 'Payload inválido',
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('maps a time slot conflict to 409', async () => {
    const respond = new CreateAppointmentHandler({
      execute: async () => {
        throw new TimeSlotUnavailableError();
      },
    });

    const response = await respond.handle({ body: payload });

    expect(response.statusCode).toBe(409);
    expect(JSON.parse(response.body)).toEqual({
      erro: 'Horário indisponível',
      mensagem:
        'O horário solicitado não está mais disponível para este médico.',
    });
  });

  it('maps an unknown doctor to 404', async () => {
    const respond = new CreateAppointmentHandler({
      execute: async () => {
        throw new DoctorNotFoundError();
      },
    });

    const response = await respond.handle({ body: payload });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toMatchObject({
      erro: 'Médico não encontrado',
    });
  });

  it('wires the Lambda to the use case and generates a UUID', async () => {
    const response = await handler({
      body: payload,
    } as APIGatewayProxyEvent);
    const body = JSON.parse(response.body) as {
      agendamento: { id: string; medico: string };
    };

    expect(response.statusCode).toBe(201);
    expect(body.agendamento.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(body.agendamento.medico).toBe('Dr. João Silva');
  });
});
