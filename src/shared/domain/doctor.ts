export interface Doctor {
  readonly id: number;
  readonly nome: string;
  readonly especialidade: string;
  readonly horarios_disponiveis: string[];
}
