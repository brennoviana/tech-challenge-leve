import { CreateAppointmentInput } from '../../application/create-appointment.use-case';
import { createAppointmentPayloadSchema } from './schema';

export interface CreateAppointmentRequest {
  body: string | null;
}

export class CreateAppointmentValidator {
  validate(request: CreateAppointmentRequest): CreateAppointmentInput | null {
    if (!request.body) {
      return null;
    }

    try {
      const result = createAppointmentPayloadSchema.safeParse(
        JSON.parse(request.body),
      );

      if (!result.success) {
        return null;
      }

      const appointment = result.data.agendamento;
      return {
        doctorId: appointment.medico_id,
        patientName: appointment.paciente,
        dateTime: appointment.data_horario,
      };
    } catch {
      return null;
    }
  }
}
