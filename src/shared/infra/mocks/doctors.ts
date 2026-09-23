export interface MockDoctor {
  readonly id: number;
  readonly nome: string;
  readonly especialidade: string;
  readonly horarios_disponiveis: readonly string[];
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function createMockDoctors(
  referenceDate: Date = new Date(),
): MockDoctor[] {
  const parts = dateFormatter.formatToParts(referenceDate);
  const numberPart = (type: 'year' | 'month' | 'day'): number =>
    Number(parts.find((part) => part.type === type)?.value);
  const todayUtc = Date.UTC(
    numberPart('year'),
    numberPart('month') - 1,
    numberPart('day'),
  );
  const dateInDays = (days: number): string =>
    new Date(todayUtc + days * 86_400_000).toISOString().slice(0, 10);

  return [
    {
      id: 1,
      nome: 'Dr. João Silva',
      especialidade: 'Cardiologista',
      horarios_disponiveis: [
        `${dateInDays(1)} 09:00`,
        `${dateInDays(2)} 10:00`,
        `${dateInDays(3)} 11:00`,
      ],
    },
    {
      id: 2,
      nome: 'Dra. Maria Souza',
      especialidade: 'Dermatologista',
      horarios_disponiveis: [
        `${dateInDays(4)} 14:00`,
        `${dateInDays(5)} 15:00`,
      ],
    },
  ];
}
