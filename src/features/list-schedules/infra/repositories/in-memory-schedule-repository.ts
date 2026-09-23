import type { Doctor } from '../../../../shared/domain/doctor';
import { DoctorMapper } from '../../../../shared/infra/mappers/to-doctor.mapper';
import { createMockDoctors } from '../../../../shared/infra/mocks/doctors';
import type { ScheduleRepositoryInterface } from '../../application/interfaces/schedule-repository.interface';

export class InMemoryScheduleRepository implements ScheduleRepositoryInterface {
  private readonly doctors = createMockDoctors().map((doctor) =>
    DoctorMapper.toDomain(doctor),
  );

  async list(): Promise<readonly Doctor[]> {
    return this.doctors;
  }
}
