const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();

const include = {
  patient: true,
  items: { include: { treatment: true }, orderBy: { id: 'asc' } }
};

// GET /api/quotes?patientId=1&status=ACCEPTED
router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.patientId) where.patientId = parseInt(req.query.patientId);
    if (req.query.status) where.status = req.query.status;
    const quotes = await prisma.quote.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' }
    });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quotes  { patientId, notes, items: [{ treatmentId, tooth, quantity }] }
router.post('/', auth, async (req, res) => {
  try {
    const { patientId, notes, items } = req.body;
    if (!patientId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Paciente y al menos un tratamiento son requeridos' });
    }
    const ids = items.map(i => parseInt(i.treatmentId));
    const treatments = await prisma.treatment.findMany({ where: { id: { in: ids } } });
    const byId = Object.fromEntries(treatments.map(t => [t.id, t]));

    const data = items.map(i => {
      const t = byId[parseInt(i.treatmentId)];
      if (!t) throw new Error('Tratamiento no encontrado');
      return {
        treatmentId: t.id,
        tooth: i.tooth ? parseInt(i.tooth) : null,
        quantity: i.quantity ? Math.max(1, parseInt(i.quantity)) : 1,
        price: t.price // se guarda el precio del momento
      };
    });

    const quote = await prisma.quote.create({
      data: {
        patientId: parseInt(patientId),
        notes: notes || null,
        items: { create: data }
      },
      include
    });
    res.status(201).json(quote);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/quotes/items/:itemId/done  { done }
router.put('/items/:itemId/done', auth, async (req, res) => {
  try {
    const item = await prisma.quoteItem.update({
      where: { id: parseInt(req.params.itemId) },
      data: { done: Boolean(req.body.done) }
    });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/quotes/:id/status  { status }
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['DRAFT', 'ACCEPTED', 'COMPLETED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Estado no valido' });
    }
    const quote = await prisma.quote.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
      include
    });
    res.json(quote);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
