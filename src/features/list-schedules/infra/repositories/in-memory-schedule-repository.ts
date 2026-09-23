import type { Doctor } from '../../../../shared/domain/doctor';
import { createMockDoctors } from '../../../../shared/infra/mocks/doctors';
import type { ScheduleRepository } from '../../application/ports/schedule-repository';

export class InMemoryScheduleRepository implements ScheduleRepository {
  private readonly doctors = createMockDoctors();

  async list(): Promise<readonly Doctor[]> {
    return this.doctors;
  }
}
