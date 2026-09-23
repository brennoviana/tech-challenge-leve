export const TRIAGE_PRIORITIES = [
  'emergencia',
  'avaliacao_breve',
  'consulta_eletiva',
] as const;

export type TriagePriority = (typeof TRIAGE_PRIORITIES)[number];

export interface TriageAssessment {
  readonly priority: TriagePriority;
  readonly suggestedSpecialty: string;
  readonly guidance: string;
}
