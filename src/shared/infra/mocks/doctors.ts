import type { Doctor } from '../../domain/doctor';

export function createMockDoctors(): Doctor[] {
  return [
    {
      id: 1,
      nome: 'Dr. João Silva',
      especialidade: 'Cardiologista',
      horarios_disponiveis: [
        '2026-06-10 09:00',
        '2026-06-10 10:00',
        '2026-06-10 11:00',
      ],
    },
    {
      id: 2,
      nome: 'Dra. Maria Souza',
      especialidade: 'Dermatologista',
      horarios_disponiveis: ['2026-06-11 14:00', '2026-06-11 15:00'],
    },
  ];
}
