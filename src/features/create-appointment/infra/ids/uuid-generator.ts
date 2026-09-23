import { randomUUID } from 'node:crypto';
import type { IdGeneratorInterface } from '../../application/interfaces/id-generator.interface';

export class UuidGenerator implements IdGeneratorInterface {
  generate(): string {
    return randomUUID();
  }
}
