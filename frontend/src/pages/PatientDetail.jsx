import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

const money = (n) => `Q ${Number(n || 0).toFixed(2)}`;
const input = 'w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500';

const APPT = {
  SCHEDULED: { text: 'Programada', cls: 'bg-blue-100 text-blue-700' },
  CONFIRMED: { text: 'Confirmada', cls: 'bg-dental-100 text-dental-700' },
  COMPLETED: { text: 'Completada', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { text: 'Cancelada', cls: 'bg-red-100 text-red-700' }
};
const QUOTE = {
  DRAFT: 'Borrador', ACCEPTED: 'Aceptado', COMPLETED: 'Terminado', REJECTED: 'Rechazado'
};
const TOOTH = {
  HEALTHY: 'Sano', CAVITY: 'Caries', FILLING: 'Restauración', CROWN: 'Corona',
  ROOT_CANAL: 'Endodoncia', IMPLANT: 'Implante', EXTRACTED: 'Extraído', PENDING: 'Pendiente'
};
const METHODS = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia' };

const age = (birth) => {
  if (!birth) return null;
  const b = new Date(birth);
  const now = new Date();
  let a = now.getFullYear() - b.getUTCFullYear();
  const m = now.getMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getUTCDate())) a--;
  return a;
};

const toForm = (p) => ({
  firstName: p.firstName || '',
  lastName: p.lastName || '',
  phone: p.phone || '',
  email: p.email || '',
  birthDate: p.birthDate ? p.birthDate.slice(0, 10) : '',
  address: p.address || '',
  allergies: p.allergies || '',
  medications: p.medications || '',
  medicalNotes: p.medicalNotes || ''
});

const Empty = ({ children }) => <p className="text-gray-400 text-center py-6">{children}</p>;

export default function PatientDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState('data');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = () =>
    api.get(`/patients/${id}/history`)
      .then(r => { setData(r.data); setForm(toForm(r.data.patient)); })
      .catch(err => { if (err.response?.status === 404) setNotFound(true); else console.error(err); });

  useEffect(() => { load(); }, [id]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.put(`/patients/${id}`, form);
      await load();
      setSaved(true);
    } catch (err) {
      alert('Error al guardar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (notFound) return <p>Paciente no encontrado. <Link to="/patients" className="text-dental-600 underline">Volver</Link></p>;
  if (!data || !form) return <p className="text-gray-400">Cargando...</p>;

  const { patient, appointments, quotes, payments, teeth } = data;
  const years = age(patient.birthDate);
  const done = appointments.filter(a => a.status === 'COMPLETED').length;

  const tabs = [
    { key: 'data', label: 'Datos y antecedentes' },
    { key: 'visits', label: `Citas (${appointments.length})` },
    quotes && { key: 'quotes', label: `Tratamientos (${quotes.length})` },
    payments && { key: 'payments', label: `Pagos (${payments.length})` },
    teeth && { key: 'teeth', label: `Dientes (${teeth.length})` }
  ].filter(Boolean);

  const tabCls = (t) =>
    `px-4 py-2 rounded-lg whitespace-nowrap ${tab === t ? 'bg-dental-600 text-white' : 'bg-white text-gray-600 hover:bg-dental-50'}`;

  const field = (key, label, props = {}) => (
    <div className={props.wide ? 'md:col-span-2' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {props.area ? (
        <textarea rows={3} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={input} />
      ) : (
        <input type={props.type || 'text'} required={props.required} value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={input} />
      )}
    </div>
  );

  return (
    <div>
      <Link to="/patients" className="text-sm text-dental-600 hover:underline">← Pacientes</Link>

      <div className="flex flex-wrap items-end justify-between gap-2 mt-2 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{patient.firstName} {patient.lastName}</h2>
          <p className="text-gray-500 text-sm">
            {years !== null ? `${years} años · ` : ''}{patient.phone}{patient.email ? ` · ${patient.email}` : ''}
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Paciente desde {new Date(patient.createdAt).toLocaleDateString('es')} · {done} visita(s) completada(s)
        </p>
      </div>

      {patient.allergies && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
          <span className="font-semibold">⚠️ Alergias:</span> {patient.allergies}
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(t => <button key={t.key} className={tabCls(t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'data' && (
        <form onSubmit={save} className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {field('firstName', 'Nombre', { required: true })}
          {field('lastName', 'Apellido', { required: true })}
          {field('phone', 'Teléfono', { required: true })}
          {field('email', 'Correo', { type: 'email' })}
          {field('birthDate', 'Fecha de nacimiento', { type: 'date' })}
          {field('address', 'Dirección')}
          {field('allergies', 'Alergias', { area: true, wide: true })}
          {field('medications', 'Medicamentos que toma', { area: true, wide: true })}
          {field('medicalNotes', 'Antecedentes médicos', { area: true, wide: true })}
          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="bg-dental-600 text-white px-6 py-2 rounded-lg hover:bg-dental-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && <span className="text-green-600 text-sm">✓ Guardado</span>}
          </div>
        </form>
      )}

      {tab === 'visits' && (
        <div className="bg-white rounded-xl shadow p-6">
          {appointments.length === 0 ? <Empty>Sin citas.</Empty> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Fecha</th><th className="pb-2">Hora</th>
                  <th className="pb-2">Odontólogo</th><th className="pb-2">Estado</th><th className="pb-2">Notas</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(a => {
                  const s = APPT[a.status];
                  return (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2">{new Date(a.date).toLocaleDateString('es')}</td>
                      <td className="py-2">{new Date(a.date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-2">{a.dentist.name}</td>
                      <td className="py-2"><span className={`px-2 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.text}</span></td>
                      <td className="py-2">{a.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'quotes' && quotes && (
        <div className="space-y-4">
          {quotes.length === 0 ? <div className="bg-white rounded-xl shadow p-6"><Empty>Sin presupuestos.</Empty></div> :
            quotes.map(q => (
              <div key={q.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between mb-2">
                  <p className="font-semibold">Presupuesto #{q.id} · {QUOTE[q.status]}</p>
                  <p className="text-xs text-gray-500">{new Date(q.createdAt).toLocaleDateString('es')}</p>
                </div>
                <ul className="text-sm space-y-1 mb-3">
                  {q.items.map(i => (
                    <li key={i.id} className="flex justify-between">
                      <span className={i.done ? 'line-through text-gray-400' : ''}>
                        {i.treatment.name}{i.tooth ? ` (diente ${i.tooth})` : ''} x{i.quantity}
                      </span>
                      <span>{money(i.price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between border-t pt-2 text-sm">
                  <span className="text-gray-500">
                    {q.items.filter(i => i.done).length} de {q.items.length} realizados
                  </span>
                  <span className="font-bold">
                    Total {money(q.total)}
                    {q.paid !== null && ` · Pagado ${money(q.paid)} · Saldo ${money(q.total - q.paid)}`}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {tab === 'payments' && payments && (
        <div className="bg-white rounded-xl shadow p-6">
          {payments.length === 0 ? <Empty>Sin pagos.</Empty> : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Fecha</th><th className="pb-2">Presupuesto</th>
                    <th className="pb-2">Forma</th><th className="pb-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2">{new Date(p.createdAt).toLocaleString('es')}</td>
                      <td className="py-2">{p.quoteId ? `#${p.quoteId}` : '—'}</td>
                      <td className="py-2">{METHODS[p.method]}</td>
                      <td className="py-2 text-right font-medium">{money(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-right font-bold mt-3">
                Total pagado: {money(payments.reduce((s, p) => s + p.amount, 0))}
              </p>
            </>
          )}
        </div>
      )}

      {tab === 'teeth' && teeth && (
        <div className="bg-white rounded-xl shadow p-6">
          {teeth.length === 0 ? <Empty>Sin cambios en el odontograma.</Empty> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Fecha</th><th className="pb-2">Diente</th>
                  <th className="pb-2">Estado</th><th className="pb-2">Notas</th>
                </tr>
              </thead>
              <tbody>
                {teeth.map(t => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2">{new Date(t.createdAt).toLocaleString('es')}</td>
                    <td className="py-2 font-medium">{t.tooth}</td>
                    <td className="py-2">{TOOTH[t.condition]}</td>
                    <td className="py-2">{t.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
