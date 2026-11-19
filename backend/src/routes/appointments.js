const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const { dayRange, localTime, HOUR } = require('../time');

const STATUSES = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const include = { patient: true, dentist: true };

// Busca una cita que choque con el horario pedido.
// Choca si es el mismo odontologo o el mismo paciente, y los horarios se traslapan.
async function findConflict({ date, duration, dentistId, patientId, excludeId }) {
  const start = date;
  const end = new Date(date.getTime() + duration * 60000);

  const candidates = await prisma.appointment.findMany({
    where: {
      status: { not: 'CANCELLED' },
      id: excludeId ? { not: excludeId } : undefined,
      OR: [{ dentistId }, { patientId }],
      // Ventana amplia; el calculo exacto se hace abajo
      date: { gte: new Date(start.getTime() - 24 * HOUR), lt: end }
    },
    include
  });

  for (const a of candidates) {
    const aEnd = new Date(a.date.getTime() + a.duration * 60000);
    if (a.date < end && aEnd > start) {
      const who = a.dentistId === dentistId
        ? `El odontólogo ya tiene una cita de ${localTime(a.date)} a ${localTime(aEnd)}`
        : `El paciente ya tiene una cita de ${localTime(a.date)} a ${localTime(aEnd)}`;
      return who;
    }
  }
  return null;
}

// GET /api/appointments?date=2026-11-17
router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.date) {
      const range = dayRange(req.query.date);
      if (!range) return res.status(400).json({ error: 'Fecha no válida' });
      where.date = { gte: range.start, lt: range.end };
    }
    const appointments = await prisma.appointment.findMany({
      where,
      include,
      orderBy: { date: 'asc' }
    });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/appointments/dentists  (lista de odontologos para el formulario)
router.get('/dentists', auth, async (req, res) => {
  try {
    const dentists = await prisma.user.findMany({
      where: { role: { in: ['DENTIST', 'ADMIN'] }, active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' }
    });
    res.json(dentists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/appointments
router.post('/', auth, async (req, res) => {
  try {
    const patientId = parseInt(req.body.patientId);
    const dentistId = parseInt(req.body.dentistId);
    const date = new Date(req.body.date);
    const duration = req.body.duration ? parseInt(req.body.duration) : 30;

    if (!patientId || !dentistId || isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Paciente, odontólogo y fecha son requeridos' });
    }
    if (isNaN(duration) || duration < 5 || duration > 480) {
      return res.status(400).json({ error: 'La duración debe ser de 5 a 480 minutos' });
    }

    const conflict = await findConflict({ date, duration, dentistId, patientId });
    if (conflict) return res.status(409).json({ error: conflict });

    const appointment = await prisma.appointment.create({
      data: { patientId, dentistId, date, duration, notes: req.body.notes || null },
      include
    });
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/appointments/:id  { status?, notes?, date?, duration?, dentistId?, patientId? }
router.put('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const current = await prisma.appointment.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Cita no encontrada' });

    const data = {};
    if (req.body.status !== undefined) {
      if (!STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'Estado no válido' });
      data.status = req.body.status;
    }
    if (req.body.notes !== undefined) data.notes = req.body.notes || null;
    if (req.body.date !== undefined) {
      data.date = new Date(req.body.date);
      if (isNaN(data.date.getTime())) return res.status(400).json({ error: 'Fecha no válida' });
    }
    if (req.body.duration !== undefined) {
      data.duration = parseInt(req.body.duration);
      if (isNaN(data.duration) || data.duration < 5 || data.duration > 480) {
        return res.status(400).json({ error: 'La duración debe ser de 5 a 480 minutos' });
      }
    }
    if (req.body.dentistId !== undefined) data.dentistId = parseInt(req.body.dentistId);
    if (req.body.patientId !== undefined) data.patientId = parseInt(req.body.patientId);

    // Revisar choques con el resultado final, si la cita no queda cancelada
    const final = { ...current, ...data };
    if (final.status !== 'CANCELLED') {
      const conflict = await findConflict({
        date: final.date,
        duration: final.duration,
        dentistId: final.dentistId,
        patientId: final.patientId,
        excludeId: id
      });
      if (conflict) return res.status(409).json({ error: conflict });
    }

    const appointment = await prisma.appointment.update({ where: { id }, data, include });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
