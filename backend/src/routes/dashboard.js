const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const { startOfDay, HOUR } = require('../time');

// GET /api/dashboard/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const today = startOfDay();
    const tomorrow = new Date(today.getTime() + 24 * HOUR);

    const [todayAppointments, totalPatients, completedToday] = await Promise.all([
      prisma.appointment.count({
        where: { date: { gte: today, lt: tomorrow }, status: { not: 'CANCELLED' } }
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
