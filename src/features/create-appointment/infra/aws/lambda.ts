import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CreateAppointmentUseCase } from '../../application/create-appointment';
import { CreateAppointmentHandler } from '../http/handler';
import { UuidGenerator } from '../ids/uuid-generator';
import { InMemoryAppointmentRepository } from '../repositories/in-memory-appointment-repository';

const appointmentRepository = new InMemoryAppointmentRepository();
const createAppointmentUseCase = new CreateAppointmentUseCase(
  appointmentRepository,
  new UuidGenerator(),
);
const httpHandler = new CreateAppointmentHandler(createAppointmentUseCase);

export const handler = (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => httpHandler.handle(event);
