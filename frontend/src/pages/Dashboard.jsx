import React, { useEffect, useState } from 'react';
import api from '../services/api';

const StatCard = ({ icon, label, value, color }) => (
  <div className={`bg-white rounded-xl shadow p-6 border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <span className="text-4xl">{icon}</span>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      api.get('/dashboard/stats'),
      api.get(`/appointments?date=${today}`)
    ]).then(([statsRes, apptRes]) => {
      setStats(statsRes.data);
      setAppointments(apptRes.data);
    }).catch(console.error);
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Panel principal</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon="📅" label="Citas hoy" value={stats?.todayAppointments ?? '—'} color="border-dental-500" />
        <StatCard icon="✅" label="Atendidos hoy" value={stats?.completedToday ?? '—'} color="border-green-500" />
        <StatCard icon="👥" label="Total pacientes" value={stats?.totalPatients ?? '—'} color="border-purple-500" />
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Citas de hoy</h3>
        {appointments.length === 0 ? (
          <p className="text-gray-400">No hay citas para hoy.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Hora</th>
                <th className="pb-2">Paciente</th>
                <th className="pb-2">Odontólogo</th>
                <th className="pb-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-2">{new Date(a.date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-2">{a.patient.firstName} {a.patient.lastName}</td>
                  <td className="py-2">{a.dentist.name}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      a.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
