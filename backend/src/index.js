const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const auth = require('./middleware/auth');
const audit = require('./middleware/audit');
const { apiLimiter } = require('./middleware/rateLimit');

// Sin esta clave los logins fallan. Mejor avisar al arrancar.
if (!process.env.JWT_SECRET) {
  console.error('FALTA la variable JWT_SECRET. El servidor no puede arrancar.');
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.warn('AVISO: JWT_SECRET es corta. Usa 32 caracteres o mas.');
}

const app = express();

// Render pone un proxy delante: asi se ve la IP real de cada persona
app.set('trust proxy', 1);

app.use(helmet());

// FRONTEND_URL = direccion de tu pagina (sin "/" al final). Varias, separadas por coma.
// Si no esta definida, se acepta cualquier origen.
const allowed = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);
app.use(cors({ origin: allowed.length ? allowed : true }));

app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter);
app.use(audit);

const ALL = ['ADMIN', 'DENTIST', 'RECEPTIONIST', 'ASSISTANT'];

// Quien puede entrar a cada modulo
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', auth, auth.access(ALL), require('./routes/patients'));
app.use('/api/appointments', auth, auth.access(ALL), require('./routes/appointments'));
app.use('/api/dashboard', auth, auth.access(ALL), require('./routes/dashboard'));
app.use('/api/odontogram', auth, auth.access(['ADMIN', 'DENTIST', 'ASSISTANT']), require('./routes/odontogram'));
app.use('/api/treatments', auth, auth.access(['ADMIN', 'DENTIST', 'RECEPTIONIST'], ['ADMIN']), require('./routes/treatments'));
app.use('/api/quotes', auth, auth.access(['ADMIN', 'DENTIST', 'RECEPTIONIST']), require('./routes/quotes'));
app.use('/api/finance', auth, auth.access(['ADMIN', 'RECEPTIONIST']), require('./routes/finance'));
app.use('/api/inventory', auth, auth.access(['ADMIN', 'DENTIST', 'ASSISTANT']), require('./routes/inventory'));
app.use('/api/users', auth, auth.access(['ADMIN']), require('./routes/users'));

// Health check para Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Clinica Dental API funcionando' });
});

// Ruta que no existe
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Errores generales (por ejemplo, un JSON mal escrito)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El JSON enviado no es válido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Los datos enviados son demasiado grandes' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
