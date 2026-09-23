export class TriageUnavailableError extends Error {
  constructor() {
    super('Triage service unavailable');
    this.name = 'TriageUnavailableError';
  }
}
