import { Appointment } from '../../src/features/create-appointment/domain/appointment';
import { DoctorNotFoundError } from '../../src/features/create-appointment/domain/errors';
import { InMemoryAppointmentRepository } from '../../src/features/create-appointment/infra/repositories/in-memory-appointment-repository';
import { InMemoryScheduleRepository } from '../../src/features/list-schedules/infra/repositories/in-memory-schedule-repository';
import { Doctor } from '../../src/shared/domain/doctor';
import { createMockDoctors } from '../../src/shared/infra/mocks/doctors';

describe('In-memory doctor repositories', () => {
  it('converts mock data into domain doctors', async () => {
    const mockDoctor = createMockDoctors()[0];
    const appointmentRepository = new InMemoryAppointmentRepository();
    const scheduleRepository = new InMemoryScheduleRepository();

    expect(mockDoctor).not.toBeInstanceOf(Doctor);
    expect(
      await appointmentRepository.findDoctorById(mockDoctor.id),
    ).toBeInstanceOf(Doctor);
    expect((await scheduleRepository.list())[0]).toBeInstanceOf(Doctor);
  });

  it('rejects an appointment for a doctor that does not exist', async () => {
    const repository = new InMemoryAppointmentRepository();
    const appointment = new Appointment({
      id: 'test-id',
      doctorId: 999,
      patientName: 'Carlos Almeida',
      dateTime: '2026-06-10 09:00',
    });

    await expect(
      repository.createIfAvailable(appointment),
    ).rejects.toBeInstanceOf(DoctorNotFoundError);
  });
});
