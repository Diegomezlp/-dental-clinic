// Fecha de hoy en la hora de la computadora, como 'AAAA-MM-DD'.
// (toISOString usa hora UTC y en la tarde da el dia siguiente)
export function localToday() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
