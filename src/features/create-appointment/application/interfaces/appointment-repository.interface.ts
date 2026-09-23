import type { Doctor } from '../../../../shared/domain/doctor';
import { Appointment } from '../../domain/appointment';

export interface AppointmentRepositoryInterface {
  findDoctorById(id: number): Promise<Doctor | null>;
  createIfAvailable(appointment: Appointment): Promise<boolean>;
}
