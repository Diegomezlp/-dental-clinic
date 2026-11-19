const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

// Revisa el token Y vuelve a leer al usuario en la base de datos.
// Asi, si un administrador cambia un rol o desactiva a alguien, se aplica al instante.
async function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, active: true }
    });
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuario inactivo o no existe' });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// access(['ADMIN','DENTIST'])                -> esos roles leen y escriben
// access(['ADMIN','DENTIST'], ['ADMIN'])     -> esos leen, solo ADMIN escribe
auth.access = (readRoles, writeRoles = readRoles) => (req, res, next) => {
  const isRead = req.method === 'GET' || req.method === 'HEAD';
  const allowed = isRead ? readRoles : writeRoles;
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'No tienes permiso para esta acción' });
  }
  next();
};

module.exports = auth;
