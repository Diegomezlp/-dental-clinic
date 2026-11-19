// Render corre en hora UTC. Guatemala es UTC-6 (sin cambio de hora).
// Se puede cambiar con la variable TZ_OFFSET_HOURS en Render.
const OFFSET = parseInt(process.env.TZ_OFFSET_HOURS ?? '-6');
const HOUR = 3600e3;

// Inicio del dia (00:00 hora local) de una fecha
function startOfDay(date = new Date()) {
  const local = new Date(date.getTime() + OFFSET * HOUR);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - OFFSET * HOUR);
}

function startOfMonth(date = new Date()) {
  const local = new Date(date.getTime() + OFFSET * HOUR);
  local.setUTCDate(1);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - OFFSET * HOUR);
}

// '2026-11-17' -> { start, end } del dia completo en hora local, o null si no es valida
function dayRange(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(str))) return null;
  const [y, m, d] = str.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d) - OFFSET * HOUR);
  if (isNaN(start.getTime())) return null;
  return { start, end: new Date(start.getTime() + 24 * HOUR) };
}

// Hora local como 'HH:MM'
function localTime(date) {
  const l = new Date(date.getTime() + OFFSET * HOUR);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(l.getUTCHours())}:${pad(l.getUTCMinutes())}`;
}

module.exports = { startOfDay, startOfMonth, dayRange, localTime, HOUR };
