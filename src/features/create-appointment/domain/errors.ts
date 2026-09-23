export class DoctorNotFoundError extends Error {
  constructor() {
    super('Doctor not found');
    this.name = 'DoctorNotFoundError';
  }
}

export class TimeSlotUnavailableError extends Error {
  constructor() {
    super('Time slot unavailable');
    this.name = 'TimeSlotUnavailableError';
  }
}
