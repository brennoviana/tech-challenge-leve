import {
  TimeSlotUnavailableError,
  DoctorNotFoundError,
} from '../../src/features/create-appointment/domain/errors';
import { InMemoryAppointmentRepository } from '../../src/features/create-appointment/infra/repositories/in-memory-appointment-repository';
import { CreateAppointmentUseCase } from '../../src/features/create-appointment/application/create-appointment.use-case';

describe('CreateAppointmentUseCase', () => {
  function createScenario() {
    const repository = new InMemoryAppointmentRepository();
    const useCase = new CreateAppointmentUseCase(repository, {
      generate: () => 'test-id',
    });

    return useCase;
  }

  const request = {
    doctorId: 1,
    patientName: 'Carlos Almeida',
    dateTime: '2026-06-10 09:00',
  };

  it('creates an appointment with the doctor details', async () => {
    const useCase = createScenario();

    const created = await useCase.execute(request);

    expect(created).toEqual({
      doctorName: 'Dr. João Silva',
      appointment: {
        id: 'test-id',
        doctorId: 1,
        patientName: 'Carlos Almeida',
        dateTime: '2026-06-10 09:00',
      },
    });
  });

  it('prevents double booking for the same doctor and time slot', async () => {
    const useCase = createScenario();

    await useCase.execute(request);

    await expect(useCase.execute(request)).rejects.toBeInstanceOf(
      TimeSlotUnavailableError,
    );
  });

  it('distinguishes an unknown doctor from an unavailable slot', async () => {
    const useCase = createScenario();

    await expect(
      useCase.execute({ ...request, doctorId: 999 }),
    ).rejects.toBeInstanceOf(DoctorNotFoundError);
    await expect(
      useCase.execute({ ...request, dateTime: '2026-06-10 12:00' }),
    ).rejects.toBeInstanceOf(TimeSlotUnavailableError);
  });
});
