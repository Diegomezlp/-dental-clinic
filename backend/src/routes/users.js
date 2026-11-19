const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');

const ROLES = ['ADMIN', 'DENTIST', 'RECEPTIONIST', 'ASSISTANT'];
const publicFields = { id: true, name: true, email: true, role: true, active: true, createdAt: true };

// Solo ADMIN llega aqui (se controla en index.js)

// GET /api/users
router.get('/', async (req, res) => {
  try {
    res.json(await prisma.user.findMany({ select: publicFields, orderBy: { name: 'asc' } }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/audit  -> ultimos 200 cambios
router.get('/audit', async (req, res) => {
  try {
    res.json(await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users  { name, email, password, role }
router.post('/', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password, role } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Nombre y correo son requeridos' });
    if (!password || String(password).length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Rol no válido' });

    const user = await prisma.user.create({
      data: { name, email, role, password: await bcrypt.hash(password, 10) },
      select: publicFields
    });
    res.status(201).json(user);
  } catch (err) {
    const msg = err.code === 'P2002' ? 'Ese correo ya está en uso' : err.message;
    res.status(400).json({ error: msg });
  }
});

// PUT /api/users/:id  { name?, role?, active?, password? }
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = {};

    if (req.body.name !== undefined) data.name = String(req.body.name).trim();
    if (req.body.role !== undefined) {
      if (!ROLES.includes(req.body.role)) return res.status(400).json({ error: 'Rol no válido' });
      data.role = req.body.role;
    }
    if (req.body.active !== undefined) data.active = Boolean(req.body.active);
    if (req.body.password !== undefined) {
      if (String(req.body.password).length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
      }
      data.password = await bcrypt.hash(req.body.password, 10);
    }

    // Un admin no puede quitarse su propio acceso
    if (id === req.user.id && (data.role && data.role !== 'ADMIN' || data.active === false)) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol ni desactivarte' });
    }

    const user = await prisma.user.update({ where: { id }, data, select: publicFields });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
