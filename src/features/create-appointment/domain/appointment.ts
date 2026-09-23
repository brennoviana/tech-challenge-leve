interface AppointmentProps {
  readonly id: string;
  readonly doctorId: number;
  readonly patientName: string;
  readonly dateTime: string;
}

export class Appointment {
  readonly id: string;
  readonly doctorId: number;
  readonly patientName: string;
  readonly dateTime: string;

  constructor(props: AppointmentProps) {
    this.id = props.id;
    this.doctorId = props.doctorId;
    this.patientName = props.patientName;
    this.dateTime = props.dateTime;
  }
}
