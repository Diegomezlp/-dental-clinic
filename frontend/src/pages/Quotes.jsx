import React, { useEffect, useState } from 'react';
import api from '../services/api';

const STATUS = {
  DRAFT:     { text: 'Borrador',  cls: 'bg-gray-100 text-gray-700' },
  ACCEPTED:  { text: 'Aceptado',  cls: 'bg-blue-100 text-blue-700' },
  COMPLETED: { text: 'Terminado', cls: 'bg-green-100 text-green-700' },
  REJECTED:  { text: 'Rechazado', cls: 'bg-red-100 text-red-700' }
};

const money = (n) => `Q ${n.toFixed(2)}`;
const total = (q) => q.items.reduce((s, i) => s + i.price * i.quantity, 0);
const emptyLine = { treatmentId: '', tooth: '', quantity: 1 };

export default function Quotes() {
  const [patients, setPatients] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get(`/quotes${filter ? `?patientId=${filter}` : ''}`)
      .then(r => setQuotes(r.data)).catch(console.error);

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    Promise.all([api.get('/patients'), api.get('/treatments')])
      .then(([p, t]) => { setPatients(p.data); setTreatments(t.data.filter(x => x.active)); })
      .catch(console.error);
  }, []);

  const setLine = (i, patch) =>
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const priceOf = (id) => treatments.find(t => t.id === parseInt(id))?.price || 0;
  const formTotal = lines.reduce((s, l) => s + priceOf(l.treatmentId) * (parseInt(l.quantity) || 0), 0);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/quotes', {
        patientId,
        notes,
        items: lines.filter(l => l.treatmentId)
      });
      setShowForm(false);
      setPatientId('');
      setNotes('');
      setLines([{ ...emptyLine }]);
      load();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id, status) => {
    await api.put(`/quotes/${id}/status`, { status });
    load();
  };

  const toggleDone = async (item) => {
    await api.put(`/quotes/items/${item.id}/done`, { done: !item.done });
    load();
  };

  const input = 'w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Presupuestos</h2>
        <div className="flex gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">Todos los pacientes</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
          </select>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-dental-600 text-white px-4 py-2 rounded-lg hover:bg-dental-700">
            + Nuevo presupuesto
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Nuevo presupuesto</h3>
          {treatments.length === 0 && (
            <p className="text-red-500 mb-3">Primero agrega tratamientos en el catálogo.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
              <select required value={patientId} onChange={(e) => setPatientId(e.target.value)} className={input}>
                <option value="">Elige un paciente</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className={input} />
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <select required value={l.treatmentId} onChange={(e) => setLine(i, { treatmentId: e.target.value })}
                  className={`${input} col-span-6`}>
                  <option value="">Tratamiento</option>
                  {treatments.map(t => <option key={t.id} value={t.id}>{t.name} - Q {t.price.toFixed(2)}</option>)}
                </select>
                <input type="number" min="11" max="48" placeholder="Diente" value={l.tooth}
                  onChange={(e) => setLine(i, { tooth: e.target.value })} className={`${input} col-span-2`} />
                <input type="number" min="1" value={l.quantity}
                  onChange={(e) => setLine(i, { quantity: e.target.value })} className={`${input} col-span-2`} />
                <span className="col-span-1 text-sm text-right">{money(priceOf(l.treatmentId) * (parseInt(l.quantity) || 0))}</span>
                <button type="button" disabled={lines.length === 1}
                  onClick={() => setLines(lines.filter((_, idx) => idx !== i))}
                  className="col-span-1 text-red-500 disabled:opacity-30">✕</button>
              </div>
            ))}
            <button type="button" onClick={() => setLines([...lines, { ...emptyLine }])}
              className="text-dental-600 text-sm hover:underline">+ Agregar otra línea</button>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-lg font-bold">Total: {money(formTotal)}</p>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-dental-600 text-white px-6 py-2 rounded-lg hover:bg-dental-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar presupuesto'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg border hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {quotes.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400">No hay presupuestos.</div>
        ) : quotes.map(q => {
          const done = q.items.filter(i => i.done).length;
          return (
            <div key={q.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{q.patient.firstName} {q.patient.lastName}</p>
                  <p className="text-xs text-gray-500">
                    #{q.id} · {new Date(q.createdAt).toLocaleDateString('es')}
                    {q.notes ? ` · ${q.notes}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS[q.status].cls}`}>
                    {STATUS[q.status].text}
                  </span>
                  <select value={q.status} onChange={(e) => setStatus(q.id, e.target.value)}
                    className="border rounded-lg px-2 py-1 text-sm">
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
                  </select>
                </div>
              </div>

              <table className="w-full text-sm">
                <tbody>
                  {q.items.map(i => (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="py-1 w-8">
                        <input type="checkbox" checked={i.done} onChange={() => toggleDone(i)}
                          title="Marcar como realizado" />
                      </td>
                      <td className={`py-1 ${i.done ? 'line-through text-gray-400' : ''}`}>
                        {i.treatment.name}{i.tooth ? ` (diente ${i.tooth})` : ''}
                      </td>
                      <td className="py-1 text-right">{i.quantity} x {money(i.price)}</td>
                      <td className="py-1 text-right w-28">{money(i.price * i.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between mt-3 text-sm">
                <span className="text-gray-500">{done} de {q.items.length} realizados</span>
                <span className="font-bold text-base">Total: {money(total(q))}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
