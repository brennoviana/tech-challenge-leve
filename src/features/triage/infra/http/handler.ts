import type {
  TriageInput,
  TriageResult,
} from '../../application/triage.use-case';
import { TriageUnavailableError } from '../../domain/errors';
import {
  jsonResponse,
  type HttpResponse,
} from '../../../../shared/infra/http/json-response';
import { LogRequest } from '../../../../shared/infra/http/log-request';
import { logger } from '../../../../shared/infra/logging/logger';
import { TriageValidator, type TriageRequest } from './validation';

type Triage = {
  execute(input: TriageInput): Promise<TriageResult>;
};

export class TriageHandler {
  constructor(
    private readonly triage: Triage,
    private readonly validator = new TriageValidator(),
  ) {}

  @LogRequest('POST /triagem')
  async handle(request: TriageRequest): Promise<HttpResponse> {
    const input = this.validator.validate(request);

    if (!input) {
      return jsonResponse(400, {
        erro: 'Payload inválido',
        mensagem: 'Informe sintomas com 3 a 1000 caracteres.',
      });
    }

    try {
      const { assessment, notice } = await this.triage.execute(input);

      return jsonResponse(200, {
        triagem: {
          prioridade: assessment.priority,
          especialidade_sugerida: assessment.suggestedSpecialty,
          orientacao: assessment.guidance,
        },
        aviso: notice,
      });
    } catch (error: unknown) {
      if (error instanceof TriageUnavailableError) {
        return jsonResponse(503, {
          erro: 'Triagem indisponível',
          mensagem: 'Tente novamente mais tarde.',
        });
      }

      logger.operationFailed('triage.assess', error);
      return jsonResponse(500, { erro: 'Erro interno do servidor' });
    }
  }
}
