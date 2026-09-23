export class Doctor {
  constructor(
    readonly id: number,
    readonly nome: string,
    readonly especialidade: string,
    readonly horarios_disponiveis: readonly string[],
  ) {}

  offersSlot(dateTime: string): boolean {
    return this.horarios_disponiveis.includes(dateTime);
  }
}
