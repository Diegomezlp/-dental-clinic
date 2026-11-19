const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();

const CONDITIONS = ['HEALTHY', 'CAVITY', 'FILLING', 'CROWN', 'ROOT_CANAL', 'IMPLANT', 'EXTRACTED', 'PENDING'];

// GET /api/odontogram/:patientId  -> historial completo (el mas nuevo primero)
router.get('/:patientId', auth, async (req, res) => {
  try {
    const records = await prisma.toothRecord.findMany({
      where: { patientId: parseInt(req.params.patientId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/odontogram/:patientId  { tooth, condition, notes }
router.post('/:patientId', auth, async (req, res) => {
  try {
    const tooth = parseInt(req.body.tooth);
    const { condition, notes } = req.body;
    if (!CONDITIONS.includes(condition)) {
      return res.status(400).json({ error: 'Estado no valido' });
    }
    if (!(tooth >= 11 && tooth <= 48)) {
      return res.status(400).json({ error: 'Numero de diente no valido' });
    }
    const record = await prisma.toothRecord.create({
      data: {
        patientId: parseInt(req.params.patientId),
        tooth,
        condition,
        notes: notes || null,
        userId: req.user.id
      }
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
