const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const auth = require('../middleware/auth');

// Solo se aceptan estos campos (no se puede mandar id, fechas internas, etc.)
const ALLOWED = ['firstName', 'lastName', 'email', 'phone', 'birthDate', 'address', 'allergies', 'medications', 'medicalNotes'];

// Limpia los datos: texto vacio pasa a null y la fecha se convierte
const clean = (body) => {
  const data = {};
  for (const k of ALLOWED) {
    if (body[k] === undefined) continue;
    const v = body[k];
    data[k] = typeof v === 'string' && v.trim() === '' ? null : v;
  }
  if (data.birthDate) data.birthDate = new Date(data.birthDate);
  return data;
};

const fail = (res, err) => {
  const msg = err.code === 'P2002' ? 'Ya existe un paciente con ese correo' : err.message;
  res.status(400).json({ error: msg });
};

const sum = (rows) => rows.reduce((s, r) => s + r.amount, 0);

// GET /api/patients
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    const patients = await prisma.patient.findMany({
      where: search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } }
        ]
      } : undefined,
      orderBy: { createdAt: 'desc' }
    });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/patients/:id/history
// Devuelve solo lo que el rol del usuario puede ver. Lo demas viene como null.
router.get('/:id/history', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const role = req.user.role;
    const canQuotes = ['ADMIN', 'DENTIST', 'RECEPTIONIST'].includes(role);
    const canMoney = ['ADMIN', 'RECEPTIONIST'].includes(role);
    const canTeeth = ['ADMIN', 'DENTIST', 'ASSISTANT'].includes(role);

    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });

    const [appointments, quotes, payments, teeth] = await Promise.all([
      prisma.appointment.findMany({
        where: { patientId: id },
        include: { dentist: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' }
      }),
      canQuotes
        ? prisma.quote.findMany({
            where: { patientId: id },
            include: { items: { include: { treatment: true } }, payments: canMoney },
            orderBy: { createdAt: 'desc' }
          })
        : null,
      canMoney
        ? prisma.payment.findMany({ where: { patientId: id }, orderBy: { createdAt: 'desc' } })
        : null,
      canTeeth
        ? prisma.toothRecord.findMany({ where: { patientId: id }, orderBy: { createdAt: 'desc' } })
        : null
    ]);

    const quotesOut = quotes
      ? quotes.map(q => {
          const total = q.items.reduce((s, i) => s + i.price * i.quantity, 0);
          const { payments: qp, ...rest } = q;
          return { ...rest, total, paid: canMoney ? sum(qp || []) : null };
        })
      : null;

    res.json({ patient, appointments, quotes: quotesOut, payments, teeth });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/patients/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { appointments: { include: { dentist: { select: { id: true, name: true } } } } }
    });
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/patients
router.post('/', auth, async (req, res) => {
  try {
    const data = clean(req.body);
    if (!data.firstName || !data.lastName || !data.phone) {
      return res.status(400).json({ error: 'Nombre, apellido y teléfono son requeridos' });
    }
    const patient = await prisma.patient.create({ data });
    res.status(201).json(patient);
  } catch (err) {
    fail(res, err);
  }
});

// PUT /api/patients/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const data = clean(req.body);
    for (const k of ['firstName', 'lastName', 'phone']) {
      if (k in data && !data[k]) {
        return res.status(400).json({ error: 'Nombre, apellido y teléfono no pueden quedar vacíos' });
      }
    }
    const patient = await prisma.patient.update({
      where: { id: parseInt(req.params.id) },
      data
    });
    res.json(patient);
  } catch (err) {
    fail(res, err);
  }
});

module.exports = router;
