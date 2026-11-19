const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();

// Limpia los datos: texto vacío pasa a null y la fecha se convierte
const clean = (body) => {
  const data = {};
  for (const [k, v] of Object.entries(body)) {
    data[k] = typeof v === 'string' && v.trim() === '' ? null : v;
  }
  if (data.birthDate) data.birthDate = new Date(data.birthDate);
  return data;
};

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

// GET /api/patients/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { appointments: { include: { dentist: true } } }
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
    const patient = await prisma.patient.create({ data: clean(req.body) });
    res.status(201).json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/patients/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const patient = await prisma.patient.update({
      where: { id: parseInt(req.params.id) },
      data: clean(req.body)
    });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
