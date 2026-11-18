import React, { useEffect, useState } from 'react';
import api from '../services/api';

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '',
  birthDate: '', address: '', allergies: '', medications: '', medicalNotes: ''
};

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async (q = '') => {
    const { data } = await api.get(`/patients${q ? `?search=${q}` : ''}`);
    setPatients(data);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    load(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/patients', form);
      setShowForm(false);
      setForm(emptyForm);
      load(search);
    } catch (err) {
      alert('Error al guardar: ' + err.response?.data?.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pacientes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-dental-600 text-white px-4 py-2 rounded-lg hover:bg-dental-700"
        >
          + Nuevo paciente
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Registrar paciente</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'firstName', label: 'Nombre', required: true },
              { key: 'lastName', label: 'Apellido', required: true },
              { key: 'phone', label: 'Teléfono', required: true },
              { key: 'email', label: 'Correo', required: false },
              { key: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
              { key: 'address', label: 'Dirección' }
            ].map(({ key, label, required, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type || 'text'}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required={required}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alergias</label>
              <textarea
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
                rows={2}
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-dental-600 text-white px-6 py-2 rounded-lg hover:bg-dental-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2 rounded-lg border hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={handleSearch}
          className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-dental-500"
        />
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Nombre</th>
              <th className="pb-2">Teléfono</th>
              <th className="pb-2">Correo</th>
              <th className="pb-2">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-gray-400 py-6">Sin pacientes registrados</td></tr>
            ) : patients.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2 font-medium">{p.firstName} {p.lastName}</td>
                <td className="py-2">{p.phone}</td>
                <td className="py-2">{p.email || '—'}</td>
                <td className="py-2">{new Date(p.createdAt).toLocaleDateString('es')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
