import type { Doctor } from '../../../../shared/domain/doctor';
import { DoctorMapper } from '../../../../shared/infra/mappers/to-doctor.mapper';
import { createMockDoctors } from '../../../../shared/infra/mocks/doctors';
import type { AppointmentRepository } from '../../application/ports/appointment-repository';
import { Appointment } from '../../domain/appointment';
import { DoctorNotFoundError } from '../../domain/errors';

export class InMemoryAppointmentRepository implements AppointmentRepository {
  private readonly doctors = createMockDoctors().map((doctor) =>
    DoctorMapper.toDomain(doctor),
  );
  private readonly appointments = new Map<string, Appointment>();

  async findDoctorById(id: number): Promise<Doctor | null> {
    const doctor = this.doctors.find((item) => item.id === id);

    return doctor ?? null;
  }

  async createIfAvailable(appointment: Appointment): Promise<boolean> {
    const doctor = this.doctors.find(
      (item) => item.id === appointment.doctorId,
    );

    if (!doctor) {
      throw new DoctorNotFoundError();
    }

    const key = `${appointment.doctorId}:${appointment.dateTime}`;

    if (
      !doctor.offersSlot(appointment.dateTime) ||
      this.appointments.has(key)
    ) {
      return false;
    }

    this.appointments.set(key, appointment);
    return true;
  }
}
