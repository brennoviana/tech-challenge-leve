import { Doctor } from '../../domain/doctor';
import type { MockDoctor } from '../mocks/doctors';

export class DoctorMapper {
  static toDomain(data: MockDoctor): Doctor {
    return new Doctor(
      data.id,
      data.nome,
      data.especialidade,
      data.horarios_disponiveis,
    );
  }
}
