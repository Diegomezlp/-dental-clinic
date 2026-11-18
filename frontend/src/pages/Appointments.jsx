import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    api.get(`/appointments?date=${date}`)
      .then(r => setAppointments(r.data))
      .catch(console.error);
  }, [date]);

  const statusLabel = {
    SCHEDULED: { text: 'Programada', cls: 'bg-blue-100 text-blue-700' },
    CONFIRMED: { text: 'Confirmada', cls: 'bg-dental-100 text-dental-700' },
    COMPLETED: { text: 'Completada', cls: 'bg-green-100 text-green-700' },
    CANCELLED: { text: 'Cancelada', cls: 'bg-red-100 text-red-700' }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Citas</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500"
        />
      </div>

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
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.cls}`}>
                    {s.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
