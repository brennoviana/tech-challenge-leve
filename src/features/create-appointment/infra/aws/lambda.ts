import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CreateAppointmentHandler } from '../http/handler';
import { UuidGenerator } from '../ids/uuid-generator';
import { InMemoryAppointmentRepository } from '../repositories/in-memory-appointment-repository';
import { CreateAppointmentUseCase } from '../../application/create-appointment.use-case';

const appointmentRepository = new InMemoryAppointmentRepository();
const createAppointmentUseCase = new CreateAppointmentUseCase(
  appointmentRepository,
  new UuidGenerator(),
);
const httpHandler = new CreateAppointmentHandler(createAppointmentUseCase);

export const handler = (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => httpHandler.handle(event);
