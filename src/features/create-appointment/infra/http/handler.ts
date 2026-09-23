import {
  TimeSlotUnavailableError,
  DoctorNotFoundError,
} from '../../domain/errors';
import type {
  CreateAppointmentInput,
  CreateAppointmentResult,
} from '../../application/create-appointment.use-case';
import {
  jsonResponse,
  type HttpResponse,
} from '../../../../shared/infra/http/json-response';
import { LogRequest } from '../../../../shared/infra/http/log-request';
import { logger } from '../../../../shared/infra/logging/logger';
import {
  CreateAppointmentValidator,
  type CreateAppointmentRequest,
} from './validation';

type CreateAppointment = {
  execute(input: CreateAppointmentInput): Promise<CreateAppointmentResult>;
};

interface CreateAppointmentResponse {
  readonly mensagem: string;
  readonly agendamento: {
    readonly id: string;
    readonly medico: string;
    readonly paciente: string;
    readonly data_horario: string;
  };
}

export class CreateAppointmentHandler {
  constructor(
    private readonly createAppointment: CreateAppointment,
    private readonly validator = new CreateAppointmentValidator(),
  ) {}

  @LogRequest('POST /agendamento')
  async handle(request: CreateAppointmentRequest): Promise<HttpResponse> {
    const input = this.validator.validate(request);

    if (!input) {
      return jsonResponse(400, {
        erro: 'Payload inválido',
        mensagem:
          'Informe agendamento com medico_id, paciente e data_horario válidos.',
      });
    }

    try {
      const { appointment, doctorName } =
        await this.createAppointment.execute(input);

      const body: CreateAppointmentResponse = {
        mensagem: 'Agendamento realizado com sucesso',
        agendamento: {
          id: appointment.id,
          medico: doctorName,
          paciente: appointment.patientName,
          data_horario: appointment.dateTime,
        },
      };

      return jsonResponse(201, body);
    } catch (error: unknown) {
      if (error instanceof TimeSlotUnavailableError) {
        return jsonResponse(409, {
          erro: 'Horário indisponível',
          mensagem:
            'O horário solicitado não está mais disponível para este médico.',
        });
      }

      if (error instanceof DoctorNotFoundError) {
        return jsonResponse(404, {
          erro: 'Médico não encontrado',
          mensagem: 'Não existe médico para o id informado.',
        });
      }

      logger.operationFailed('appointment.create', error);
      return jsonResponse(500, { erro: 'Erro interno do servidor' });
    }
  }
}
