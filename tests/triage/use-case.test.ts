import { TriageUseCase } from '../../src/features/triage/application/triage.use-case';
import type { TriageAdvisorInterface } from '../../src/features/triage/application/interfaces/triage-advisor.interface';

describe('TriageUseCase', () => {
  it('uses the advisor contract and adds the safety notice', async () => {
    const assess = jest.fn<
      ReturnType<TriageAdvisorInterface['assess']>,
      Parameters<TriageAdvisorInterface['assess']>
    >();
    assess.mockResolvedValue({
      priority: 'consulta_eletiva',
      suggestedSpecialty: 'Dermatologia',
      guidance: 'Procure avaliação profissional.',
    });

    const useCase = new TriageUseCase({ assess });
    const result = await useCase.execute({ symptoms: 'Manchas na pele' });

    expect(assess).toHaveBeenCalledWith('Manchas na pele');
    expect(result.assessment.suggestedSpecialty).toBe('Dermatologia');
    expect(result.notice).toContain('não substitui avaliação médica');
  });
});
