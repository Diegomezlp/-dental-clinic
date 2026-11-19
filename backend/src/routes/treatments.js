const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/treatments
router.get('/', auth, async (req, res) => {
  try {
    const treatments = await prisma.treatment.findMany({ orderBy: { name: 'asc' } });
    res.json(treatments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/treatments  { name, price }
router.post('/', auth, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const price = parseFloat(req.body.price);
    if (!name || isNaN(price) || price < 0) {
      return res.status(400).json({ error: 'Nombre y precio validos son requeridos' });
    }
    const treatment = await prisma.treatment.create({ data: { name, price } });
    res.status(201).json(treatment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/treatments/:id  { name?, price?, active? }
router.put('/:id', auth, async (req, res) => {
  try {
    const data = {};
    if (req.body.name !== undefined) data.name = String(req.body.name).trim();
    if (req.body.price !== undefined) data.price = parseFloat(req.body.price);
    if (req.body.active !== undefined) data.active = Boolean(req.body.active);
    const treatment = await prisma.treatment.update({
      where: { id: parseInt(req.params.id) },
      data
    });
    res.json(treatment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
