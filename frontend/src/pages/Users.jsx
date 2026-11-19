import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ROLES = {
  ADMIN: 'Administrador',
  DENTIST: 'Odontólogo',
  RECEPTIONIST: 'Recepcionista',
  ASSISTANT: 'Asistente'
};

const ACCESS = {
  ADMIN: 'Todo el sistema',
  DENTIST: 'Pacientes, citas, odontograma, tratamientos, presupuestos, inventario',
  RECEPTIONIST: 'Pacientes, citas, presupuestos, finanzas',
  ASSISTANT: 'Pacientes, citas, odontograma, inventario'
};

const input = 'w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500';
const empty = { name: '', email: '', password: '', role: 'RECEPTIONIST' };

export default function Users() {
  const me = JSON.parse(localStorage.getItem('user') || '{}');
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () =>
    Promise.all([api.get('/users'), api.get('/users/audit')])
      .then(([u, a]) => { setUsers(u.data); setLogs(a.data); })
      .catch(console.error);

  useEffect(() => { load(); }, []);

  const run = async (fn) => {
    try { await fn(); await load(); }
    catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
  };

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    await run(async () => {
      await api.post('/users', form);
      setForm(empty);
      setShowForm(false);
    });
    setSaving(false);
  };

  const changeRole = (u, role) => run(() => api.put(`/users/${u.id}`, { role }));
  const toggle = (u) => run(() => api.put(`/users/${u.id}`, { active: !u.active }));
  const resetPassword = (u) => {
    const p = window.prompt(`Nueva contraseña para ${u.name} (mínimo 8 caracteres)`);
    if (p === null) return;
    run(() => api.put(`/users/${u.id}`, { password: p }));
  };

  const tabCls = (t) =>
    `px-4 py-2 rounded-lg ${tab === t ? 'bg-dental-600 text-white' : 'bg-white text-gray-600 hover:bg-dental-50'}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Usuarios y seguridad</h2>
        {tab === 'users' && (
          <button onClick={() => setShowForm(!showForm)}
            className="bg-dental-600 text-white px-4 py-2 rounded-lg hover:bg-dental-700">
            + Nuevo usuario
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <button className={tabCls('users')} onClick={() => setTab('users')}>Usuarios</button>
        <button className={tabCls('roles')} onClick={() => setTab('roles')}>Qué puede hacer cada rol</button>
        <button className={tabCls('audit')} onClick={() => setTab('audit')}>Auditoría</button>
      </div>

      {tab === 'users' && (
        <>
          {showForm && (
            <form onSubmit={create} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña (mínimo 8)</label>
                <input required type="password" minLength={8} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={input}>
                  {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" disabled={saving}
                  className="bg-dental-600 text-white px-6 py-2 rounded-lg hover:bg-dental-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Crear usuario'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg border hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl shadow p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Nombre</th><th className="pb-2">Correo</th>
                  <th className="pb-2">Rol</th><th className="pb-2">Estado</th><th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const self = u.id === me.id;
                  return (
                    <tr key={u.id} className={`border-b last:border-0 ${u.active ? '' : 'opacity-50'}`}>
                      <td className="py-2 font-medium">{u.name}{self && ' (tú)'}</td>
                      <td className="py-2">{u.email}</td>
                      <td className="py-2">
                        <select value={u.role} disabled={self} onChange={(e) => changeRole(u, e.target.value)}
                          className="border rounded-lg px-2 py-1 disabled:bg-gray-100">
                          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </td>
                      <td className="py-2">{u.active ? 'Activo' : 'Desactivado'}</td>
                      <td className="py-2 text-right space-x-3">
                        <button onClick={() => resetPassword(u)} className="text-dental-600 hover:underline">Cambiar contraseña</button>
                        {!self && (
                          <button onClick={() => toggle(u)} className="text-gray-500 hover:underline">
                            {u.active ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'roles' && (
        <div className="bg-white rounded-xl shadow p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b"><th className="pb-2">Rol</th><th className="pb-2">Puede entrar a</th></tr>
            </thead>
            <tbody>
              {Object.entries(ROLES).map(([k, v]) => (
                <tr key={k} className="border-b last:border-0">
                  <td className="py-2 font-medium">{v}</td>
                  <td className="py-2">{ACCESS[k]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">
            Solo el administrador crea o cambia precios en el catálogo de tratamientos.
          </p>
        </div>
      )}

      {tab === 'audit' && (
        <div className="bg-white rounded-xl shadow p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Fecha</th><th className="pb-2">Usuario</th>
                <th className="pb-2">Acción</th><th className="pb-2">Módulo</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-gray-400 py-6">Sin registros.</td></tr>
              ) : logs.map(l => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="py-2">{new Date(l.createdAt).toLocaleString('es')}</td>
                  <td className="py-2">{l.userName} <span className="text-gray-400">({ROLES[l.role] || l.role})</span></td>
                  <td className="py-2">{l.action}</td>
                  <td className="py-2">{l.entity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">Se muestran los últimos 200 cambios.</p>
        </div>
      )}
    </div>
  );
}
