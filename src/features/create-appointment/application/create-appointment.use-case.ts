import { Appointment } from '../domain/appointment';
import {
  TimeSlotUnavailableError,
  DoctorNotFoundError,
} from '../domain/errors';
import type { AppointmentRepositoryInterface } from './interfaces/appointment-repository.interface';
import type { IdGeneratorInterface } from './interfaces/id-generator.interface';

export interface CreateAppointmentInput {
  readonly doctorId: number;
  readonly patientName: string;
  readonly dateTime: string;
}

export interface CreateAppointmentResult {
  readonly appointment: Appointment;
  readonly doctorName: string;
}

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepositoryInterface,
    private readonly idGenerator: IdGeneratorInterface,
  ) {}

  async execute(
    input: CreateAppointmentInput,
  ): Promise<CreateAppointmentResult> {
    const doctor = await this.appointmentRepository.findDoctorById(
      input.doctorId,
    );

    if (!doctor) {
      throw new DoctorNotFoundError();
    }

    if (!doctor.offersSlot(input.dateTime)) {
      throw new TimeSlotUnavailableError();
    }

    const appointment = new Appointment({
      id: this.idGenerator.generate(),
      doctorId: doctor.id,
      patientName: input.patientName,
      dateTime: input.dateTime,
    });

    const created =
      await this.appointmentRepository.createIfAvailable(appointment);

    if (!created) {
      throw new TimeSlotUnavailableError();
    }

    return { appointment, doctorName: doctor.nome };
  }
}
