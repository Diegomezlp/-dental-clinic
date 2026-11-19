import React, { useEffect, useState } from 'react';
import api from '../services/api';

// Numeracion FDI: arriba 18..11 | 21..28, abajo 48..41 | 31..38
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const CONDITIONS = {
  HEALTHY:    { label: 'Sano',            cls: 'bg-white border-gray-300 text-gray-700' },
  CAVITY:     { label: 'Caries',          cls: 'bg-red-200 border-red-500 text-red-800' },
  FILLING:    { label: 'Restauración',    cls: 'bg-blue-200 border-blue-500 text-blue-800' },
  CROWN:      { label: 'Corona',          cls: 'bg-yellow-200 border-yellow-500 text-yellow-800' },
  ROOT_CANAL: { label: 'Endodoncia',      cls: 'bg-purple-200 border-purple-500 text-purple-800' },
  IMPLANT:    { label: 'Implante',        cls: 'bg-green-200 border-green-500 text-green-800' },
  EXTRACTED:  { label: 'Extraído',        cls: 'bg-gray-400 border-gray-600 text-gray-800' },
  PENDING:    { label: 'Pendiente',       cls: 'bg-orange-200 border-orange-500 text-orange-800' }
};

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

  const Tooth = ({ n }) => {
    const c = CONDITIONS[current[n]?.condition || 'HEALTHY'];
    const selected = tooth === n;
    return (
      <button
        type="button"
        onClick={() => setTooth(n)}
        className={`w-10 h-12 rounded-lg border-2 text-xs font-bold ${c.cls} ${selected ? 'ring-4 ring-dental-500' : ''}`}
        title={c.label}
      >
        {n}
      </button>
    );
  };

  const Row = ({ list }) => (
    <div className="flex justify-center gap-1">
      {list.slice(0, 8).map(n => <Tooth key={n} n={n} />)}
      <div className="w-1 bg-gray-300 mx-1" />
      {list.slice(8).map(n => <Tooth key={n} n={n} />)}
    </div>
  );

  const history = records.filter(r => r.tooth === tooth);
  const input = 'w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500';

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
          <div className="bg-white rounded-xl shadow p-6 mb-6 space-y-3 overflow-x-auto">
            <Row list={UPPER} />
            <Row list={LOWER} />
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {Object.entries(CONDITIONS).map(([k, v]) => (
                <span key={k} className={`px-2 py-1 rounded border text-xs ${v.cls}`}>{v.label}</span>
              ))}
            </div>
          </div>

          {tooth ? (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Diente {tooth}</h3>
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
                      <span className={`px-2 py-1 rounded border text-xs ${CONDITIONS[r.condition].cls}`}>
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
            <p className="text-gray-500">Toca un diente para ver o cambiar su estado.</p>
          )}
        </>
      )}
    </div>
  );
}
