import type { Doctor } from '../../../../shared/domain/doctor';
import { Appointment } from '../../domain/appointment';

export interface AppointmentRepository {
  findDoctorById(id: number): Promise<Doctor | null>;
  createIfAvailable(appointment: Appointment): Promise<boolean>;
}
