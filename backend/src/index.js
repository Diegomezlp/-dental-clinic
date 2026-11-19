const express = require('express');
const cors = require('cors');
require('dotenv').config();

const auth = require('./middleware/auth');
const audit = require('./middleware/audit');

const app = express();

app.use(cors());
app.use(express.json());
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
