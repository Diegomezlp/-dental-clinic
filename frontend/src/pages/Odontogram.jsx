import React, { useEffect, useState } from 'react';
import api from '../services/api';

// Numeracion FDI. En pantalla: lado derecho del paciente = izquierda de la imagen.
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const CONDITIONS = {
  HEALTHY:    { label: 'Sano',         fill: '#ffffff', stroke: '#9ca3af' },
  CAVITY:     { label: 'Caries',       fill: '#fca5a5', stroke: '#dc2626' },
  FILLING:    { label: 'Restauración', fill: '#93c5fd', stroke: '#2563eb' },
  CROWN:      { label: 'Corona',       fill: '#fde047', stroke: '#ca8a04' },
  ROOT_CANAL: { label: 'Endodoncia',   fill: '#d8b4fe', stroke: '#9333ea' },
  IMPLANT:    { label: 'Implante',     fill: '#86efac', stroke: '#16a34a' },
  EXTRACTED:  { label: 'Extraído',     fill: '#e5e7eb', stroke: '#4b5563' },
  PENDING:    { label: 'Pendiente',    fill: '#fdba74', stroke: '#ea580c' }
};

// Tipo de diente segun el ultimo numero
const TYPES = {
  1: { name: 'Incisivo central',  w: 22, h: 30 },
  2: { name: 'Incisivo lateral',  w: 20, h: 28 },
  3: { name: 'Canino',            w: 22, h: 32 },
  4: { name: 'Primer premolar',   w: 26, h: 28 },
  5: { name: 'Segundo premolar',  w: 26, h: 28 },
  6: { name: 'Primer molar',      w: 36, h: 32 },
  7: { name: 'Segundo molar',     w: 34, h: 30 },
  8: { name: 'Tercer molar (muela del juicio)', w: 30, h: 28 }
};

const QUADRANTS = {
  1: 'superior derecho',
  2: 'superior izquierdo',
  3: 'inferior izquierdo',
  4: 'inferior derecho'
};

const toothName = (n) => `${TYPES[n % 10].name} ${QUADRANTS[Math.floor(n / 10)]}`;

// Geometria de los arcos
const CX = 350, RX = 290, RY = 190;
const UPPER_CY = 225, LOWER_CY = 305;

function place(index, upper) {
  const t = ((index + 0.5) / 16) * Math.PI;
  const cy = upper ? UPPER_CY : LOWER_CY;
  const dir = upper ? -1 : 1;
  const x = CX - RX * Math.cos(t);
  const y = cy + dir * RY * Math.sin(t);
  // Direccion hacia afuera de la boca
  let nx = (x - CX) / (RX * RX);
  let ny = (y - cy) / (RY * RY);
  const len = Math.hypot(nx, ny) || 1;
  nx /= len; ny /= len;
  const angle = (Math.atan2(ny, nx) * 180) / Math.PI + 90;
  return { x, y, nx, ny, angle };
}

export default function Odontogram() {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [records, setRecords] = useState([]);
  const [tooth, setTooth] = useState(null);
  const [condition, setCondition] = useState('CAVITY');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/patients').then(r => setPatients(r.data)).catch(console.error);
  }, []);

  const load = (id) =>
    api.get(`/odontogram/${id}`).then(r => setRecords(r.data)).catch(console.error);

  useEffect(() => {
    setTooth(null);
    if (patientId) load(patientId); else setRecords([]);
  }, [patientId]);

  // Estado actual de cada diente = el registro mas nuevo
  const current = {};
  [...records].reverse().forEach(r => { current[r.tooth] = r; });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/odontogram/${patientId}`, { tooth, condition, notes });
      setNotes('');
      await load(patientId);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const renderTooth = (n, index, upper) => {
    const { x, y, nx, ny, angle } = place(index, upper);
    const type = TYPES[n % 10];
    const c = CONDITIONS[current[n]?.condition || 'HEALTHY'];
    const selected = tooth === n;
    const extracted = current[n]?.condition === 'EXTRACTED';
    const isMolar = n % 10 >= 6;
    return (
      <g key={n} onClick={() => setTooth(n)} style={{ cursor: 'pointer' }}>
        <title>{`${n} - ${toothName(n)} (${c.label})`}</title>
        <g transform={`translate(${x},${y}) rotate(${angle})`}>
          <rect
            x={-type.w / 2} y={-type.h / 2} width={type.w} height={type.h}
            rx={isMolar ? 9 : 11}
            fill={c.fill}
            stroke={selected ? '#0284c7' : c.stroke}
            strokeWidth={selected ? 4 : 2}
            opacity={extracted ? 0.55 : 1}
          />
          {isMolar && (
            <path
              d={`M ${-type.w / 4} 0 H ${type.w / 4} M 0 ${-type.h / 4} V ${type.h / 4}`}
              stroke={c.stroke} strokeWidth="1.2" opacity="0.6" fill="none"
            />
          )}
          {extracted && (
            <path
              d={`M ${-type.w / 3} ${-type.h / 3} L ${type.w / 3} ${type.h / 3} M ${type.w / 3} ${-type.h / 3} L ${-type.w / 3} ${type.h / 3}`}
              stroke="#374151" strokeWidth="2.5"
            />
          )}
        </g>
        <text
          x={x + nx * 33} y={y + ny * 33 + 4}
          textAnchor="middle" fontSize="12" fontWeight="700"
          fill={selected ? '#0284c7' : '#374151'}
        >
          {n}
        </text>
      </g>
    );
  };

  const history = records.filter(r => r.tooth === tooth);
  const input = 'w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500';
  const gum = (cy, upper) =>
    `M ${CX - RX} ${cy} A ${RX} ${RY} 0 0 ${upper ? 1 : 0} ${CX + RX} ${cy}`;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Odontograma</h2>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
        <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className={input}>
          <option value="">Elige un paciente</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
        </select>
      </div>

      {patientId && (
        <>
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <svg viewBox="0 0 700 540" className="w-full max-w-3xl mx-auto">
              {/* Encias */}
              <path d={gum(UPPER_CY, true)} fill="none" stroke="#fecdd3" strokeWidth="64" strokeLinecap="round" />
              <path d={gum(LOWER_CY, false)} fill="none" stroke="#fecdd3" strokeWidth="64" strokeLinecap="round" />

              {/* Etiquetas */}
              <text x={CX} y={UPPER_CY - 40} textAnchor="middle" fontSize="14" fill="#9ca3af">SUPERIOR</text>
              <text x={CX} y={LOWER_CY + 52} textAnchor="middle" fontSize="14" fill="#9ca3af">INFERIOR</text>
              <text x="8" y="268" fontSize="11" fill="#9ca3af">Derecha</text>
              <text x="8" y="281" fontSize="11" fill="#9ca3af">del paciente</text>
              <text x="692" y="268" textAnchor="end" fontSize="11" fill="#9ca3af">Izquierda</text>
              <text x="692" y="281" textAnchor="end" fontSize="11" fill="#9ca3af">del paciente</text>

              {UPPER.map((n, i) => renderTooth(n, i, true))}
              {LOWER.map((n, i) => renderTooth(n, i, false))}
            </svg>

            <div className="flex flex-wrap gap-2 pt-3 border-t justify-center">
              {Object.entries(CONDITIONS).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1 text-xs text-gray-700">
                  <span style={{ background: v.fill, borderColor: v.stroke }}
                    className="inline-block w-4 h-4 rounded border-2" />
                  {v.label}
                </span>
              ))}
            </div>
          </div>

          {tooth ? (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold">Diente {tooth}</h3>
              <p className="text-gray-500 mb-4 capitalize">{toothName(tooth)}</p>
              <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className={input}>
                    {Object.entries(CONDITIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={input} />
                </div>
                <div className="md:col-span-2">
                  <button type="submit" disabled={saving}
                    className="bg-dental-600 text-white px-6 py-2 rounded-lg hover:bg-dental-700 disabled:opacity-50">
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>

              <h4 className="font-semibold text-gray-700 mb-2">Historial del diente {tooth}</h4>
              {history.length === 0 ? (
                <p className="text-gray-400">Sin cambios registrados.</p>
              ) : (
                <ul className="space-y-2">
                  {history.map(r => (
                    <li key={r.id} className="flex items-center gap-3 text-sm border-b pb-2">
                      <span style={{ background: CONDITIONS[r.condition].fill, borderColor: CONDITIONS[r.condition].stroke }}
                        className="px-2 py-1 rounded border text-xs">
                        {CONDITIONS[r.condition].label}
                      </span>
                      <span className="text-gray-500">{new Date(r.createdAt).toLocaleString('es')}</span>
                      <span>{r.notes}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center">Toca un diente para ver su nombre y cambiar su estado.</p>
          )}
        </>
      )}
    </div>
  );
}
