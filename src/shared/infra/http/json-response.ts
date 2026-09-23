export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export function jsonResponse(statusCode: number, body: unknown): HttpResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  };
}
