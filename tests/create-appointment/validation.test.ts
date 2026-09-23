import { CreateAppointmentValidator } from '../../src/features/create-appointment/infra/http/validation';

const validator = new CreateAppointmentValidator();

function requestWithDateTime(dateTime: string) {
  return {
    body: JSON.stringify({
      agendamento: {
        medico_id: 1,
        paciente: ' Carlos Almeida ',
        data_horario: dateTime,
      },
    }),
  };
}

describe('CreateAppointmentValidator', () => {
  it('accepts a leap day and trims the patient name', () => {
    expect(validator.validate(requestWithDateTime('2024-02-29 09:00'))).toEqual(
      {
        doctorId: 1,
        patientName: 'Carlos Almeida',
        dateTime: '2024-02-29 09:00',
      },
    );
  });

  it.each(['2025-02-29 09:00', '2026-06-10 24:00', '0000-01-01 09:00'])(
    'rejects an invalid date or time: %s',
    (dateTime) => {
      expect(validator.validate(requestWithDateTime(dateTime))).toBeNull();
    },
  );
});
