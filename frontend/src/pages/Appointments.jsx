import React, { useEffect, useState } from 'react';
import api from '../services/api';

const today = () => new Date().toISOString().split('T')[0];
const emptyForm = { patientId: '', dentistId: '', day: today(), time: '09:00', duration: 30, notes: '' };

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState(today());
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get(`/appointments?date=${date}`).then(r => setAppointments(r.data)).catch(console.error);

  useEffect(() => { load(); }, [date]);

  useEffect(() => {
    Promise.all([api.get('/patients'), api.get('/appointments/dentists')])
      .then(([p, d]) => { setPatients(p.data); setDentists(d.data); })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/appointments', {
        patientId: form.patientId,
        dentistId: form.dentistId,
        date: new Date(`${form.day}T${form.time}`).toISOString(),
        duration: form.duration,
        notes: form.notes
      });
      setShowForm(false);
      setDate(form.day);
      setForm(emptyForm);
      load();
    } catch (err) {
      alert('Error al guardar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id, status) => {
    await api.put(`/appointments/${id}`, { status });
    load();
  };

  const statusLabel = {
    SCHEDULED: { text: 'Programada', cls: 'bg-blue-100 text-blue-700' },
    CONFIRMED: { text: 'Confirmada', cls: 'bg-dental-100 text-dental-700' },
    COMPLETED: { text: 'Completada', cls: 'bg-green-100 text-green-700' },
    CANCELLED: { text: 'Cancelada', cls: 'bg-red-100 text-red-700' }
  };

  const input = 'w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Citas</h2>
        <div className="flex gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-lg px-3 py-2" />
          <button onClick={() => setShowForm(!showForm)}
            className="bg-dental-600 text-white px-4 py-2 rounded-lg hover:bg-dental-700">
            + Nueva cita
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Agendar cita</h3>
          {patients.length === 0 && (
            <p className="text-red-500 mb-3">Primero registra un paciente.</p>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
              <select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} className={input}>
                <option value="">Elige un paciente</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Odontólogo</label>
              <select required value={form.dentistId} onChange={(e) => setForm({ ...form, dentistId: e.target.value })} className={input}>
                <option value="">Elige un odontólogo</option>
                {dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Día</label>
              <input type="date" required value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
              <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className={input}>
                {[15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={input} />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-dental-600 text-white px-6 py-2 rounded-lg hover:bg-dental-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar cita'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg border hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        {appointments.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No hay citas para esta fecha.</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => {
              const s = statusLabel[a.status] || { text: a.status, cls: 'bg-gray-100 text-gray-700' };
              return (
                <div key={a.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="text-dental-600 font-bold w-14 text-center">
                    {new Date(a.date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{a.patient.firstName} {a.patient.lastName}</p>
                    <p className="text-sm text-gray-500">Dr. {a.dentist.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.text}</span>
                  <select value={a.status} onChange={(e) => setStatus(a.id, e.target.value)}
                    className="border rounded-lg px-2 py-1 text-sm">
                    {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
