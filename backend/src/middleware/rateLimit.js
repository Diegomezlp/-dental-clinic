const rateLimit = require('express-rate-limit');

// Limite general: 300 peticiones por minuto por IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Espera un momento.' }
});

const loginMessage = { error: 'Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.' };

// Login: 5 intentos fallidos por correo + IP cada 15 minutos.
// Los logins correctos no cuentan.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}|${String(req.body?.email || '').trim().toLowerCase()}`,
  message: loginMessage
});

// Login: 30 intentos fallidos por IP cada 15 minutos (frena a quien prueba muchos correos)
const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: loginMessage
});

module.exports = { apiLimiter, loginLimiter, loginIpLimiter };
