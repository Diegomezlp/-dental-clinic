import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

const ALL = ['ADMIN', 'DENTIST', 'RECEPTIONIST', 'ASSISTANT'];

// Debe coincidir con los permisos del backend
const MENU = [
  { to: '/',             label: '📊 Dashboard',     roles: ALL, end: true },
  { to: '/patients',     label: '👥 Pacientes',     roles: ALL },
  { to: '/appointments', label: '📅 Citas',         roles: ALL },
  { to: '/odontogram',   label: '🦷 Odontograma',   roles: ['ADMIN', 'DENTIST', 'ASSISTANT'] },
  { to: '/treatments',   label: '💊 Tratamientos',  roles: ['ADMIN', 'DENTIST', 'RECEPTIONIST'] },
  { to: '/quotes',       label: '🧾 Presupuestos',  roles: ['ADMIN', 'DENTIST', 'RECEPTIONIST'] },
  { to: '/finance',      label: '💰 Finanzas',      roles: ['ADMIN', 'RECEPTIONIST'] },
  { to: '/inventory',    label: '📦 Inventario',    roles: ['ADMIN', 'DENTIST', 'ASSISTANT'] },
  { to: '/users',        label: '🔐 Usuarios',      roles: ['ADMIN'] }
];

const ROLE_NAMES = {
  ADMIN: 'Administrador',
  DENTIST: 'Odontólogo',
  RECEPTIONIST: 'Recepcionista',
  ASSISTANT: 'Asistente'
};

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navClass = ({ isActive }) =>
    `block px-4 py-2 rounded-lg transition-colors ${
      isActive ? 'bg-dental-600 text-white' : 'text-gray-600 hover:bg-dental-50'
    }`;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Barra lateral */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-dental-700">🦷 Clínica Dental</h1>
          <p className="text-sm text-gray-700 mt-1">{user.name}</p>
          <p className="text-xs text-gray-400">{ROLE_NAMES[user.role] || user.role}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {MENU.filter(m => m.roles.includes(user.role)).map(m => (
            <NavLink key={m.to} to={m.to} end={m.end} className={navClass}>{m.label}</NavLink>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
