const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

// POST /api/auth/register
// Solo sirve para crear el PRIMER administrador. Despues se cierra.
// Los demas usuarios los crea un administrador en la seccion Usuarios.
router.post('/register', async (req, res) => {
  try {
    const count = await prisma.user.count();
    if (count > 0) {
      return res.status(403).json({
        error: 'El registro está cerrado. Un administrador debe crear usuarios en la sección Usuarios.'
      });
    }
    const { email, password, name } = req.body;
    if (!email || !name || !password || String(password).length < 8) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña de 8 o más caracteres son requeridos' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: String(email).trim().toLowerCase(), password: hashed, name, role: 'ADMIN' }
    });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password || '', user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    prisma.auditLog
      .create({
        data: { userId: user.id, userName: user.name, role: user.role, action: 'ENTRAR', entity: 'auth', path: '/api/auth/login' }
      })
      .catch(() => {});

    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
