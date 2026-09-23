import { CreateAppointmentUseCase } from '../../src/features/create-appointment/application/create-appointment';
import type { AppointmentRepository } from '../../src/features/create-appointment/application/ports/appointment-repository';
import {
  TimeSlotUnavailableError,
  DoctorNotFoundError,
} from '../../src/features/create-appointment/domain/errors';

const request = {
  doctorId: 1,
  patientName: 'Carlos Almeida',
  dateTime: '2026-06-10 09:00',
};

function createScenario() {
  const repository: jest.Mocked<AppointmentRepository> = {
    findDoctorById: jest.fn().mockResolvedValue({
      id: 1,
      nome: 'Dr. João Silva',
      especialidade: 'Cardiologista',
      horarios_disponiveis: ['2026-06-10 09:00'],
    }),
    createIfAvailable: jest.fn().mockResolvedValue(true),
  };
  const generate = jest.fn().mockReturnValue('test-id');
  const useCase = new CreateAppointmentUseCase(repository, { generate });

  return { useCase, repository, generate };
}

describe('CreateAppointmentUseCase in isolation', () => {
  it('does not reserve or generate an ID when the doctor does not exist', async () => {
    const { useCase, repository, generate } = createScenario();
    repository.findDoctorById.mockResolvedValue(null);

    await expect(useCase.execute(request)).rejects.toBeInstanceOf(
      DoctorNotFoundError,
    );
    expect(repository.createIfAvailable).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });

  it('does not reserve or generate an ID for an unavailable slot', async () => {
    const { useCase, repository, generate } = createScenario();

    await expect(
      useCase.execute({ ...request, dateTime: '2026-06-10 10:00' }),
    ).rejects.toBeInstanceOf(TimeSlotUnavailableError);
    expect(repository.createIfAvailable).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });

  it('returns a conflict when the repository rejects the reservation', async () => {
    const { useCase, repository } = createScenario();
    repository.createIfAvailable.mockResolvedValue(false);

    await expect(useCase.execute(request)).rejects.toBeInstanceOf(
      TimeSlotUnavailableError,
    );
    expect(repository.createIfAvailable).toHaveBeenCalledWith({
      id: 'test-id',
      doctorId: 1,
      patientName: 'Carlos Almeida',
      dateTime: '2026-06-10 09:00',
    });
  });
});
