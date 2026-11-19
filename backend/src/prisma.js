const { PrismaClient } = require('@prisma/client');

// Una sola conexion compartida para el codigo nuevo
module.exports = new PrismaClient();
