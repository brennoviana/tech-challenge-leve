import { Appointment } from '../../src/features/create-appointment/domain/appointment';
import { Doctor } from '../../src/shared/domain/doctor';

const appointment = {
  id: 'test-id',
  doctorId: 1,
  patientName: 'Carlos Almeida',
  dateTime: '2026-06-10 09:00',
};

describe('Appointment domain', () => {
  it('creates an appointment', () => {
    const created = new Appointment(appointment);
    expect(created).toBeInstanceOf(Appointment);
  });

  it('checks whether a doctor offers a time slot', () => {
    const doctor = new Doctor(1, 'Dr. João Silva', 'Cardiologista', [
      '2026-06-10 09:00',
    ]);

    expect(doctor.offersSlot('2026-06-10 09:00')).toBe(true);
    expect(doctor.offersSlot('2026-06-10 10:00')).toBe(false);
  });
});
