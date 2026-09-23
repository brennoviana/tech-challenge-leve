import type { TriageAssessment } from '../domain/triage-assessment';
import type { TriageAdvisorInterface } from './interfaces/triage-advisor.interface';

export interface TriageInput {
  readonly symptoms: string;
}

export interface TriageResult {
  readonly assessment: TriageAssessment;
  readonly notice: string;
}

export class TriageUseCase {
  constructor(private readonly advisor: TriageAdvisorInterface) {}

  async execute(input: TriageInput): Promise<TriageResult> {
    const assessment = await this.advisor.assess(input.symptoms);

    return {
      assessment,
      notice:
        'Esta orientação não substitui avaliação médica. Em caso de sintomas graves ou piora, procure atendimento de urgência.',
    };
  }
}
