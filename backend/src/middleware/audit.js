const prisma = require('../prisma');

const ACTIONS = { POST: 'CREAR', PUT: 'EDITAR', PATCH: 'EDITAR', DELETE: 'BORRAR' };

// Guarda quien hizo cada cambio. No guarda el contenido enviado (por ejemplo, contraseñas).
module.exports = (req, res, next) => {
  res.on('finish', () => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return;
    if (!req.user || res.statusCode >= 400) return;

    const path = req.originalUrl.split('?')[0];
    const entity = path.split('/')[2] || 'otro';
    prisma.auditLog
      .create({
        data: {
          userId: req.user.id,
          userName: req.user.name,
          role: req.user.role,
          action: ACTIONS[req.method] || req.method,
          entity,
          path
        }
      })
      .catch((err) => console.error('Auditoria fallo:', err.message));
  });
  next();
};
