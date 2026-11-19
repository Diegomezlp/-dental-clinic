const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();

const { startOfDay, startOfMonth } = require('../time');
const startOfToday = () => startOfDay();

const sum = (rows) => rows.reduce((s, r) => s + r.amount, 0);
const quoteTotal = (q) => q.items.reduce((s, i) => s + i.price * i.quantity, 0);

// Presupuestos aceptados o terminados con su saldo
async function receivables(patientId) {
  const quotes = await prisma.quote.findMany({
    where: {
      status: { in: ['ACCEPTED', 'COMPLETED'] },
      ...(patientId ? { patientId } : {})
    },
    include: { patient: true, items: true, payments: true },
    orderBy: { createdAt: 'asc' }
  });
  return quotes.map(q => {
    const total = quoteTotal(q);
    const paid = sum(q.payments);
    return {
      quoteId: q.id,
      patientId: q.patientId,
      patient: `${q.patient.firstName} ${q.patient.lastName}`,
      notes: q.notes,
      createdAt: q.createdAt,
      total,
      paid,
      balance: Math.round((total - paid) * 100) / 100
    };
  });
}

// GET /api/finance/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const today = startOfToday();
    const month = startOfMonth();
    const [payToday, payMonth, expMonth, rec] = await Promise.all([
      prisma.payment.findMany({ where: { createdAt: { gte: today } } }),
      prisma.payment.findMany({ where: { createdAt: { gte: month } } }),
      prisma.expense.findMany({ where: { createdAt: { gte: month } } }),
      receivables()
    ]);
    const incomeMonth = sum(payMonth);
    const expensesMonth = sum(expMonth);
    res.json({
      incomeToday: sum(payToday),
      incomeMonth,
      expensesMonth,
      balanceMonth: incomeMonth - expensesMonth,
      receivableTotal: rec.reduce((s, r) => s + Math.max(r.balance, 0), 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/receivables?patientId=1  (solo con saldo pendiente)
router.get('/receivables', auth, async (req, res) => {
  try {
    const patientId = req.query.patientId ? parseInt(req.query.patientId) : undefined;
    const list = (await receivables(patientId)).filter(r => r.balance > 0);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/payments
router.get('/payments', auth, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/payments  { patientId, quoteId?, amount, method, notes }
router.post('/payments', auth, async (req, res) => {
  try {
    const patientId = parseInt(req.body.patientId);
    const quoteId = req.body.quoteId ? parseInt(req.body.quoteId) : null;
    const amount = parseFloat(req.body.amount);
    const method = req.body.method || 'CASH';

    if (!patientId || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Paciente y monto mayor a 0 son requeridos' });
    }
    if (!['CASH', 'CARD', 'TRANSFER'].includes(method)) {
      return res.status(400).json({ error: 'Forma de pago no valida' });
    }

    if (quoteId) {
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { items: true, payments: true }
      });
      if (!quote || quote.patientId !== patientId) {
        return res.status(400).json({ error: 'El presupuesto no es de ese paciente' });
      }
      const balance = quoteTotal(quote) - sum(quote.payments);
      if (amount > balance + 0.001) {
        return res.status(400).json({ error: `El monto supera el saldo (Q ${balance.toFixed(2)})` });
      }
    }

    const payment = await prisma.payment.create({
      data: { patientId, quoteId, amount, method, notes: req.body.notes || null, userId: req.user.id },
      include: { patient: true }
    });
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/finance/expenses
router.get('/expenses', auth, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/expenses  { description, category, amount }
router.post('/expenses', auth, async (req, res) => {
  try {
    const description = String(req.body.description || '').trim();
    const amount = parseFloat(req.body.amount);
    if (!description || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Descripcion y monto mayor a 0 son requeridos' });
    }
    const expense = await prisma.expense.create({
      data: {
        description,
        amount,
        category: req.body.category || 'Otros',
        userId: req.user.id
      }
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
