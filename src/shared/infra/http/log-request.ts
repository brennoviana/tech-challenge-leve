import type { HttpResponse } from './json-response';
import { logger } from '../logging/logger';

type HttpMethod = (this: unknown, ...args: unknown[]) => Promise<HttpResponse>;

export function LogRequest(route: string): MethodDecorator {
  return (_target, _propertyKey, descriptor) => {
    const method = descriptor.value as HttpMethod;

    const wrapped: HttpMethod = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<HttpResponse> {
      let statusCode: number | null = null;
      const startedAt = performance.now();

      try {
        const response = await method.apply(this, args);
        statusCode = response.statusCode;
        return response;
      } finally {
        logger.requestCompleted(
          route,
          statusCode,
          Math.round(performance.now() - startedAt),
        );
      }
    };

    descriptor.value = wrapped as typeof descriptor.value;

    return descriptor;
  };
}
