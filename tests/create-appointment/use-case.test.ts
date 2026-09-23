import { CreateAppointmentUseCase } from '../../src/features/create-appointment/application/create-appointment.use-case';
import type { AppointmentRepositoryInterface } from '../../src/features/create-appointment/application/interfaces/appointment-repository.interface';
import {
  TimeSlotUnavailableError,
  DoctorNotFoundError,
} from '../../src/features/create-appointment/domain/errors';
import { Doctor } from '../../src/shared/domain/doctor';

const request = {
  doctorId: 1,
  patientName: 'Carlos Almeida',
  dateTime: '2030-01-15 09:00',
};

function createScenario() {
  const repository: jest.Mocked<AppointmentRepositoryInterface> = {
    findDoctorById: jest
      .fn()
      .mockResolvedValue(
        new Doctor(1, 'Dr. João Silva', 'Cardiologista', [request.dateTime]),
      ),
    createIfAvailable: jest.fn().mockResolvedValue(true),
  };
  const generate = jest.fn().mockReturnValue('test-id');
  const useCase = new CreateAppointmentUseCase(repository, { generate });

  return { useCase, repository, generate };
}

describe('CreateAppointmentUseCase', () => {
  it('creates an appointment with the doctor details', async () => {
    const { useCase, repository, generate } = createScenario();

    await expect(useCase.execute(request)).resolves.toEqual({
      doctorName: 'Dr. João Silva',
      appointment: {
        id: 'test-id',
        doctorId: 1,
        patientName: 'Carlos Almeida',
        dateTime: request.dateTime,
      },
    });
    expect(generate).toHaveBeenCalledTimes(1);
    expect(repository.createIfAvailable).toHaveBeenCalledWith({
      id: 'test-id',
      doctorId: 1,
      patientName: 'Carlos Almeida',
      dateTime: request.dateTime,
    });
  });

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
      useCase.execute({ ...request, dateTime: '2030-01-15 10:00' }),
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
    expect(repository.createIfAvailable).toHaveBeenCalledTimes(1);
  });
});
