import type { Doctor } from '../../../shared/domain/doctor';
import type { ScheduleRepository } from './ports/schedule-repository';

export class ListSchedulesUseCase {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  execute(): Promise<readonly Doctor[]> {
    return this.scheduleRepository.list();
  }
}
