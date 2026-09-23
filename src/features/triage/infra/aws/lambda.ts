import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TriageUseCase } from '../../application/triage.use-case';
import { TriageHandler } from '../http/handler';
import { OpenAiTriageAdvisor } from '../llm/openai-triage-advisor';

const advisor = new OpenAiTriageAdvisor({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
});
const httpHandler = new TriageHandler(new TriageUseCase(advisor));

export const handler = (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => httpHandler.handle(event);
