import { randomUUID } from 'node:crypto';
import type { IdGenerator } from '../../application/ports/id-generator';

export class UuidGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
