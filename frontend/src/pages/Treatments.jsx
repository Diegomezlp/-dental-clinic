import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Treatments() {
  const [treatments, setTreatments] = useState([]);
  const [form, setForm] = useState({ name: '', price: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/treatments').then(r => setTreatments(r.data)).catch(console.error);
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/treatments', form);
      setForm({ name: '', price: '' });
      load();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const changePrice = async (t) => {
    const value = window.prompt(`Nuevo precio para "${t.name}" (Q)`, t.price);
    if (value === null) return;
    const price = parseFloat(value);
    if (isNaN(price) || price < 0) return alert('Precio no valido');
    await api.put(`/treatments/${t.id}`, { price });
    load();
  };

  const toggle = async (t) => {
    await api.put(`/treatments/${t.id}`, { active: !t.active });
    load();
  };

  const input = 'w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500';

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Catálogo de tratamientos</h2>

      <form onSubmit={add} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Limpieza dental" className={input} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio (Q)</label>
          <input required type="number" min="0" step="0.01" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} />
        </div>
        <button type="submit" disabled={saving}
          className="bg-dental-600 text-white px-6 py-2 rounded-lg hover:bg-dental-700 disabled:opacity-50">
          {saving ? 'Guardando...' : '+ Agregar'}
        </button>
      </form>

      <div className="bg-white rounded-xl shadow p-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Tratamiento</th>
              <th className="pb-2">Precio</th>
              <th className="pb-2">Estado</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {treatments.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-gray-400 py-6">Aún no hay tratamientos.</td></tr>
            ) : treatments.map(t => (
              <tr key={t.id} className={`border-b last:border-0 ${t.active ? '' : 'opacity-50'}`}>
                <td className="py-2 font-medium">{t.name}</td>
                <td className="py-2">Q {t.price.toFixed(2)}</td>
                <td className="py-2">{t.active ? 'Activo' : 'Oculto'}</td>
                <td className="py-2 text-right space-x-3">
                  <button onClick={() => changePrice(t)} className="text-dental-600 hover:underline">Cambiar precio</button>
                  <button onClick={() => toggle(t)} className="text-gray-500 hover:underline">
                    {t.active ? 'Ocultar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
