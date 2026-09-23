import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ListSchedulesUseCase } from '../../application/list-schedules';
import { ListSchedulesHandler } from '../http/handler';
import { InMemoryScheduleRepository } from '../repositories/in-memory-schedule-repository';

const scheduleRepository = new InMemoryScheduleRepository();
const listSchedulesUseCase = new ListSchedulesUseCase(scheduleRepository);
const httpHandler = new ListSchedulesHandler(listSchedulesUseCase);

type LambdaHandler = (
  event: APIGatewayProxyEvent,
) => Promise<APIGatewayProxyResult>;

export const handler: LambdaHandler = () => httpHandler.handle();
