const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();

const toInt = (v, def = 0) => {
  const n = parseInt(v);
  return isNaN(n) ? def : n;
};

// ---------- Proveedores ----------

// GET /api/inventory/suppliers
router.get('/suppliers', auth, async (req, res) => {
  try {
    res.json(await prisma.supplier.findMany({ orderBy: { name: 'asc' } }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory/suppliers  { name, phone, email }
router.post('/suppliers', auth, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
    const supplier = await prisma.supplier.create({
      data: { name, phone: req.body.phone || null, email: req.body.email || null }
    });
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------- Insumos ----------

// GET /api/inventory/items
router.get('/items', auth, async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: { supplier: true },
      orderBy: { name: 'asc' }
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory/items  { name, unit, minStock, supplierId, stock }
router.post('/items', auth, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
    const stock = Math.max(0, toInt(req.body.stock));

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.inventoryItem.create({
        data: {
          name,
          unit: req.body.unit || 'unidad',
          minStock: Math.max(0, toInt(req.body.minStock)),
          supplierId: req.body.supplierId ? toInt(req.body.supplierId) : null,
          stock
        },
        include: { supplier: true }
      });
      if (stock > 0) {
        await tx.stockMovement.create({
          data: { itemId: created.id, type: 'IN', quantity: stock, notes: 'Existencia inicial', userId: req.user.id }
        });
      }
      return created;
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/inventory/items/:id  { name?, unit?, minStock?, supplierId?, active? }
router.put('/items/:id', auth, async (req, res) => {
  try {
    const data = {};
    if (req.body.name !== undefined) data.name = String(req.body.name).trim();
    if (req.body.unit !== undefined) data.unit = req.body.unit;
    if (req.body.minStock !== undefined) data.minStock = Math.max(0, toInt(req.body.minStock));
    if (req.body.supplierId !== undefined) data.supplierId = req.body.supplierId ? toInt(req.body.supplierId) : null;
    if (req.body.active !== undefined) data.active = Boolean(req.body.active);
    const item = await prisma.inventoryItem.update({
      where: { id: toInt(req.params.id) },
      data,
      include: { supplier: true }
    });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------- Movimientos ----------

// GET /api/inventory/movements
router.get('/movements', auth, async (req, res) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: { item: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(movements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory/movements  { itemId, type: IN|OUT, quantity, notes }
router.post('/movements', auth, async (req, res) => {
  try {
    const itemId = toInt(req.body.itemId);
    const quantity = toInt(req.body.quantity);
    const { type, notes } = req.body;

    if (!itemId || quantity <= 0 || !['IN', 'OUT'].includes(type)) {
      return res.status(400).json({ error: 'Insumo, tipo y cantidad mayor a 0 son requeridos' });
    }

    const movement = await prisma.$transaction(async (tx) => {
      if (type === 'IN') {
        await tx.inventoryItem.update({
          where: { id: itemId },
          data: { stock: { increment: quantity } }
        });
      } else {
        // Solo descuenta si alcanza; evita existencias negativas
        const r = await tx.inventoryItem.updateMany({
          where: { id: itemId, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } }
        });
        if (r.count === 0) throw new Error('No hay suficientes existencias');
      }
      return tx.stockMovement.create({
        data: { itemId, type, quantity, notes: notes || null, userId: req.user.id },
        include: { item: true }
      });
    });
    res.status(201).json(movement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
