import type { TriageAssessment } from '../../domain/triage-assessment';

export interface TriageAdvisorInterface {
  assess(symptoms: string): Promise<TriageAssessment>;
}
