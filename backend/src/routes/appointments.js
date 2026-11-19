const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/appointments?date=2026-11-17
router.get('/', auth, async (req, res) => {
  try {
    const { date } = req.query;
    let where = {};
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.date = { gte: start, lt: end };
    }
    const appointments = await prisma.appointment.findMany({
      where,
      include: { patient: true, dentist: true },
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
      where: { role: { in: ['DENTIST', 'ADMIN'] } },
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
    const { patientId, dentistId, date, duration, notes } = req.body;
    const appointment = await prisma.appointment.create({
      data: {
        patientId: parseInt(patientId),
        dentistId: parseInt(dentistId),
        date: new Date(date),
        duration: duration ? parseInt(duration) : 30,
        notes: notes || null
      },
      include: { patient: true, dentist: true }
    });
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/appointments/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const appointment = await prisma.appointment.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
      include: { patient: true, dentist: true }
    });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
