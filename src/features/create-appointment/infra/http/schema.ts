import { z } from 'zod';

function isValidDateTime(value: string): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value) ||
    value.startsWith('0000-')
  ) {
    return false;
  }

  const iso = `${value.replace(' ', 'T')}:00.000Z`;
  const date = new Date(iso);

  return !Number.isNaN(date.getTime()) && date.toISOString() === iso;
}

export const createAppointmentPayloadSchema = z.object({
  agendamento: z.object({
    medico_id: z.number().int().positive().refine(Number.isSafeInteger),
    paciente: z.string().trim().min(1),
    data_horario: z.string().refine(isValidDateTime),
  }),
});
