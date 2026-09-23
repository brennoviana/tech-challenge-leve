import type { Doctor } from '../../../../shared/domain/doctor';

export interface ScheduleRepositoryInterface {
  list(): Promise<readonly Doctor[]>;
}
