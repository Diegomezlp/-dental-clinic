import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

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
          <p className="text-sm text-gray-500 mt-1">{user.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/" end className={navClass}>📊 Dashboard</NavLink>
          <NavLink to="/patients" className={navClass}>👥 Pacientes</NavLink>
          <NavLink to="/appointments" className={navClass}>📅 Citas</NavLink>
          <NavLink to="/odontogram" className={navClass}>🦷 Odontograma</NavLink>
          <NavLink to="/treatments" className={navClass}>💊 Tratamientos</NavLink>
          <NavLink to="/quotes" className={navClass}>🧾 Presupuestos</NavLink>
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
