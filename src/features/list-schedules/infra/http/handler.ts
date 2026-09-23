import type { Doctor } from '../../../../shared/domain/doctor';
import {
  jsonResponse,
  type HttpResponse,
} from '../../../../shared/infra/http/json-response';
import { LogRequest } from '../../../../shared/infra/http/log-request';
import { logger } from '../../../../shared/infra/logging/logger';

type ListSchedules = {
  execute(): Promise<readonly Doctor[]>;
};

interface ListSchedulesResponse {
  readonly medicos: readonly Doctor[];
}

export class ListSchedulesHandler {
  constructor(private readonly listSchedules: ListSchedules) {}

  @LogRequest('GET /agendas')
  async handle(): Promise<HttpResponse> {
    try {
      const doctors = await this.listSchedules.execute();

      const body: ListSchedulesResponse = { medicos: doctors };
      return jsonResponse(200, body);
    } catch (error: unknown) {
      logger.operationFailed('schedules.list', error);

      return jsonResponse(500, { erro: 'Erro interno do servidor' });
    }
  }
}
