import { z } from 'zod';

export const triagePayloadSchema = z
  .object({
    sintomas: z.string().trim().min(3).max(1000),
  })
  .strict();
