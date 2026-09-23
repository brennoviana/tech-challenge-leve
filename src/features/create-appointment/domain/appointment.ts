export interface Appointment {
  readonly id: string;
  readonly doctorId: number;
  readonly patientName: string;
  readonly dateTime: string;
}
