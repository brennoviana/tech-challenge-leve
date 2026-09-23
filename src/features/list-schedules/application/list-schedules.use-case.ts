import type { Doctor } from '../../../shared/domain/doctor';
import type { ScheduleRepositoryInterface } from './interfaces/schedule-repository.interface';

export class ListSchedulesUseCase {
  constructor(
    private readonly scheduleRepository: ScheduleRepositoryInterface,
  ) {}

  execute(): Promise<readonly Doctor[]> {
    return this.scheduleRepository.list();
  }
}
