const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/dashboard/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAppointments, totalPatients, completedToday] = await Promise.all([
      prisma.appointment.count({
        where: { date: { gte: today, lt: tomorrow } }
      }),
      prisma.patient.count(),
      prisma.appointment.count({
        where: { date: { gte: today, lt: tomorrow }, status: 'COMPLETED' }
      })
    ]);

    res.json({ todayAppointments, totalPatients, completedToday });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
