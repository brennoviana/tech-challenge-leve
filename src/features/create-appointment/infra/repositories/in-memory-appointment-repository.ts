import type { Doctor } from '../../../../shared/domain/doctor';
import { createMockDoctors } from '../../../../shared/infra/mocks/doctors';
import type { AppointmentRepository } from '../../application/ports/appointment-repository';
import type { Appointment } from '../../domain/appointment';

export class InMemoryAppointmentRepository implements AppointmentRepository {
  private readonly doctors = createMockDoctors();
  private readonly appointments = new Map<string, Appointment>();

  async findDoctorById(id: number): Promise<Doctor | null> {
    const doctor = this.doctors.find((item) => item.id === id);

    return doctor || null;
  }

  async createIfAvailable(appointment: Appointment): Promise<boolean> {
    const doctor = this.doctors.find(
      (item) => item.id === appointment.doctorId,
    );
    const key = `${appointment.doctorId}:${appointment.dateTime}`;

    if (
      !doctor?.horarios_disponiveis.includes(appointment.dateTime) ||
      this.appointments.has(key)
    ) {
      return false;
    }

    this.appointments.set(key, appointment);
    return true;
  }
}
