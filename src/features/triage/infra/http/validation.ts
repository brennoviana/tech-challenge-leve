import type { TriageInput } from '../../application/triage.use-case';
import { triagePayloadSchema } from './schema';

export interface TriageRequest {
  body: string | null;
}

export class TriageValidator {
  validate(request: TriageRequest): TriageInput | null {
    if (!request.body) {
      return null;
    }

    try {
      const result = triagePayloadSchema.safeParse(JSON.parse(request.body));
      return result.success ? { symptoms: result.data.sintomas } : null;
    } catch {
      return null;
    }
  }
}
