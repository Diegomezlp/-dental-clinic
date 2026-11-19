import React, { useEffect, useState } from 'react';
import api from '../services/api';

const money = (n) => `Q ${Number(n || 0).toFixed(2)}`;
const METHODS = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia' };
const CATEGORIES = ['Insumos', 'Alquiler', 'Sueldos', 'Servicios', 'Laboratorio', 'Otros'];
const input = 'w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500';

const Card = ({ label, value, color }) => (
  <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${color}`}>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
  </div>
);

export default function Finance() {
  const [tab, setTab] = useState('payments');
  const [summary, setSummary] = useState(null);
  const [patients, setPatients] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [pay, setPay] = useState({ patientId: '', quoteId: '', amount: '', method: 'CASH', notes: '' });
  const [exp, setExp] = useState({ description: '', category: 'Insumos', amount: '' });
  const [saving, setSaving] = useState(false);

  const loadAll = () =>
    Promise.all([
      api.get('/finance/summary'),
      api.get('/finance/receivables'),
      api.get('/finance/payments'),
      api.get('/finance/expenses')
    ]).then(([s, r, p, e]) => {
      setSummary(s.data); setReceivables(r.data); setPayments(p.data); setExpenses(e.data);
    }).catch(console.error);

  useEffect(() => {
    loadAll();
    api.get('/patients').then(r => setPatients(r.data)).catch(console.error);
  }, []);

  const patientQuotes = receivables.filter(r => String(r.patientId) === String(pay.patientId));
  const chosen = receivables.find(r => String(r.quoteId) === String(pay.quoteId));

  const submit = async (fn) => {
    setSaving(true);
    try { await fn(); await loadAll(); }
    catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
    finally { setSaving(false); }
  };

  const savePayment = (e) => {
    e.preventDefault();
    submit(async () => {
      await api.post('/finance/payments', pay);
      setPay({ patientId: '', quoteId: '', amount: '', method: 'CASH', notes: '' });
    });
  };

  const saveExpense = (e) => {
    e.preventDefault();
    submit(async () => {
      await api.post('/finance/expenses', exp);
      setExp({ description: '', category: 'Insumos', amount: '' });
    });
  };

  const tabCls = (t) =>
    `px-4 py-2 rounded-lg ${tab === t ? 'bg-dental-600 text-white' : 'bg-white text-gray-600 hover:bg-dental-50'}`;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Finanzas</h2>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card label="Ingresos hoy" value={money(summary?.incomeToday)} color="border-green-500" />
        <Card label="Ingresos del mes" value={money(summary?.incomeMonth)} color="border-dental-500" />
        <Card label="Egresos del mes" value={money(summary?.expensesMonth)} color="border-red-500" />
        <Card label="Ganancia del mes" value={money(summary?.balanceMonth)} color="border-purple-500" />
        <Card label="Por cobrar" value={money(summary?.receivableTotal)} color="border-orange-500" />
      </div>

      <div className="flex gap-2 mb-6">
        <button className={tabCls('payments')} onClick={() => setTab('payments')}>Cobros</button>
        <button className={tabCls('receivables')} onClick={() => setTab('receivables')}>Por cobrar</button>
        <button className={tabCls('expenses')} onClick={() => setTab('expenses')}>Egresos</button>
      </div>

      {tab === 'payments' && (
        <>
          <form onSubmit={savePayment} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
              <select required value={pay.patientId}
                onChange={(e) => setPay({ ...pay, patientId: e.target.value, quoteId: '' })} className={input}>
                <option value="">Elige un paciente</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto</label>
              <select value={pay.quoteId} onChange={(e) => setPay({ ...pay, quoteId: e.target.value })} className={input}>
                <option value="">Pago sin presupuesto</option>
                {patientQuotes.map(r => (
                  <option key={r.quoteId} value={r.quoteId}>
                    #{r.quoteId} - saldo {money(r.balance)}
                  </option>
                ))}
              </select>
              {chosen && (
                <button type="button" className="text-xs text-dental-600 mt-1 hover:underline"
                  onClick={() => setPay({ ...pay, amount: chosen.balance })}>
                  Pagar todo el saldo ({money(chosen.balance)})
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Q)</label>
              <input required type="number" min="0.01" step="0.01" value={pay.amount}
                onChange={(e) => setPay({ ...pay, amount: e.target.value })} className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pago</label>
              <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} className={input}>
                {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input value={pay.notes} onChange={(e) => setPay({ ...pay, notes: e.target.value })} className={input} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={saving}
                className="bg-dental-600 text-white px-6 py-2 rounded-lg hover:bg-dental-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Registrar cobro'}
              </button>
            </div>
          </form>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold mb-3">Últimos cobros</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Fecha</th><th className="pb-2">Paciente</th>
                  <th className="pb-2">Presupuesto</th><th className="pb-2">Forma</th>
                  <th className="pb-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-6">Sin cobros.</td></tr>
                ) : payments.map(p => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2">{new Date(p.createdAt).toLocaleString('es')}</td>
                    <td className="py-2">{p.patient.firstName} {p.patient.lastName}</td>
                    <td className="py-2">{p.quoteId ? `#${p.quoteId}` : '—'}</td>
                    <td className="py-2">{METHODS[p.method]}</td>
                    <td className="py-2 text-right font-medium">{money(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'receivables' && (
        <div className="bg-white rounded-xl shadow p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Paciente</th><th className="pb-2">Presupuesto</th>
                <th className="pb-2 text-right">Total</th><th className="pb-2 text-right">Pagado</th>
                <th className="pb-2 text-right">Saldo</th><th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {receivables.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-400 py-6">Nadie debe nada.</td></tr>
              ) : receivables.map(r => (
                <tr key={r.quoteId} className="border-b last:border-0">
                  <td className="py-2 font-medium">{r.patient}</td>
                  <td className="py-2">#{r.quoteId}</td>
                  <td className="py-2 text-right">{money(r.total)}</td>
                  <td className="py-2 text-right">{money(r.paid)}</td>
                  <td className="py-2 text-right font-bold text-orange-600">{money(r.balance)}</td>
                  <td className="py-2 text-right">
                    <button className="text-dental-600 hover:underline"
                      onClick={() => { setPay({ ...pay, patientId: r.patientId, quoteId: r.quoteId, amount: r.balance }); setTab('payments'); }}>
                      Cobrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">Solo se cuentan presupuestos en estado Aceptado o Terminado.</p>
        </div>
      )}

      {tab === 'expenses' && (
        <>
          <form onSubmit={saveExpense} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input required value={exp.description}
                onChange={(e) => setExp({ ...exp, description: e.target.value })} className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select value={exp.category} onChange={(e) => setExp({ ...exp, category: e.target.value })} className={input}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Q)</label>
              <input required type="number" min="0.01" step="0.01" value={exp.amount}
                onChange={(e) => setExp({ ...exp, amount: e.target.value })} className={input} />
            </div>
            <div className="md:col-span-4">
              <button type="submit" disabled={saving}
                className="bg-dental-600 text-white px-6 py-2 rounded-lg hover:bg-dental-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Registrar egreso'}
              </button>
            </div>
          </form>

          <div className="bg-white rounded-xl shadow p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Fecha</th><th className="pb-2">Descripción</th>
                  <th className="pb-2">Categoría</th><th className="pb-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-6">Sin egresos.</td></tr>
                ) : expenses.map(x => (
                  <tr key={x.id} className="border-b last:border-0">
                    <td className="py-2">{new Date(x.createdAt).toLocaleString('es')}</td>
                    <td className="py-2">{x.description}</td>
                    <td className="py-2">{x.category}</td>
                    <td className="py-2 text-right font-medium">{money(x.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
