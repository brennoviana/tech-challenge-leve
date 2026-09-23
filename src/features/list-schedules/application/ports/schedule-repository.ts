import type { Doctor } from '../../../../shared/domain/doctor';

export interface ScheduleRepository {
  list(): Promise<readonly Doctor[]>;
}
