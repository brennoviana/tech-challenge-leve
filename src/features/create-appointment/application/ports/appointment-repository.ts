import type { Appointment } from '../../domain/appointment';
import type { Doctor } from '../../../../shared/domain/doctor';

export interface AppointmentRepository {
  findDoctorById(id: number): Promise<Doctor | null>;
  createIfAvailable(appointment: Appointment): Promise<boolean>;
}
