import React, { useEffect, useState } from 'react';
import api from '../services/api';

const input = 'w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dental-500';
const emptyItem = { name: '', unit: 'unidad', stock: 0, minStock: 5, supplierId: '' };
const emptyMove = { itemId: '', type: 'IN', quantity: '', notes: '' };
const emptySupplier = { name: '', phone: '', email: '' };

export default function Inventory() {
  const [tab, setTab] = useState('stock');
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [movements, setMovements] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [item, setItem] = useState(emptyItem);
  const [move, setMove] = useState(emptyMove);
  const [supplier, setSupplier] = useState(emptySupplier);
  const [saving, setSaving] = useState(false);

  const loadAll = () =>
    Promise.all([
      api.get('/inventory/items'),
      api.get('/inventory/suppliers'),
      api.get('/inventory/movements')
    ]).then(([i, s, m]) => { setItems(i.data); setSuppliers(s.data); setMovements(m.data); })
      .catch(console.error);

  useEffect(() => { loadAll(); }, []);

  const run = async (fn) => {
    setSaving(true);
    try { await fn(); await loadAll(); }
    catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
    finally { setSaving(false); }
  };

  const saveItem = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post('/inventory/items', item);
      setItem(emptyItem);
      setShowItemForm(false);
    });
  };

  const saveMove = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post('/inventory/movements', move);
      setMove(emptyMove);
    });
  };

  const saveSupplier = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post('/inventory/suppliers', supplier);
      setSupplier(emptySupplier);
    });
  };

  const changeMin = (it) => {
    const v = window.prompt(`Stock mínimo para "${it.name}"`, it.minStock);
    if (v === null) return;
    const n = parseInt(v);
    if (isNaN(n) || n < 0) return alert('Número no válido');
    run(() => api.put(`/inventory/items/${it.id}`, { minStock: n }));
  };

  const toggleActive = (it) => run(() => api.put(`/inventory/items/${it.id}`, { active: !it.active }));

  const active = items.filter(i => i.active);
  const low = active.filter(i => i.stock <= i.minStock);
  const tabCls = (t) =>
    `px-4 py-2 rounded-lg ${tab === t ? 'bg-dental-600 text-white' : 'bg-white text-gray-600 hover:bg-dental-50'}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
        {tab === 'stock' && (
          <button onClick={() => setShowItemForm(!showItemForm)}
            className="bg-dental-600 text-white px-4 py-2 rounded-lg hover:bg-dental-700">
            + Nuevo insumo
          </button>
        )}
      </div>

      {low.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          <p className="font-semibold mb-1">⚠️ Hay que comprar: {low.length} insumo(s) con poco stock</p>
          <p className="text-sm">
            {low.map(i => `${i.name} (${i.stock} ${i.unit})`).join(' · ')}
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button className={tabCls('stock')} onClick={() => setTab('stock')}>Existencias</button>
        <button className={tabCls('moves')} onClick={() => setTab('moves')}>Entradas y salidas</button>
        <button className={tabCls('suppliers')} onClick={() => setTab('suppliers')}>Proveedores</button>
      </div>

      {tab === 'stock' && (
        <>
          {showItemForm && (
            <form onSubmit={saveItem} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input required value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })}
                  placeholder="Ej: Guantes de látex" className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                <input value={item.unit} onChange={(e) => setItem({ ...item, unit: e.target.value })}
                  placeholder="caja, bolsa, frasco" className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Existencia inicial</label>
                <input type="number" min="0" value={item.stock}
                  onChange={(e) => setItem({ ...item, stock: e.target.value })} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo (alerta)</label>
                <input type="number" min="0" value={item.minStock}
                  onChange={(e) => setItem({ ...item, minStock: e.target.value })} className={input} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <select value={item.supplierId} onChange={(e) => setItem({ ...item, supplierId: e.target.value })} className={input}>
                  <option value="">Sin proveedor</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-3 flex gap-3">
                <button type="submit" disabled={saving}
                  className="bg-dental-600 text-white px-6 py-2 rounded-lg hover:bg-dental-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar insumo'}
                </button>
                <button type="button" onClick={() => setShowItemForm(false)} className="px-6 py-2 rounded-lg border hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl shadow p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Insumo</th><th className="pb-2">Proveedor</th>
                  <th className="pb-2 text-right">Existencia</th><th className="pb-2 text-right">Mínimo</th>
                  <th className="pb-2">Estado</th><th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-6">Aún no hay insumos.</td></tr>
                ) : items.map(it => {
                  const isLow = it.stock <= it.minStock;
                  return (
                    <tr key={it.id} className={`border-b last:border-0 ${it.active ? '' : 'opacity-50'}`}>
                      <td className="py-2 font-medium">{it.name}</td>
                      <td className="py-2">{it.supplier?.name || '—'}</td>
                      <td className="py-2 text-right font-bold">{it.stock} {it.unit}</td>
                      <td className="py-2 text-right">{it.minStock}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {isLow ? 'Poco stock' : 'Bien'}
                        </span>
                      </td>
                      <td className="py-2 text-right space-x-3">
                        <button onClick={() => changeMin(it)} className="text-dental-600 hover:underline">Cambiar mínimo</button>
                        <button onClick={() => toggleActive(it)} className="text-gray-500 hover:underline">
                          {it.active ? 'Ocultar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'moves' && (
        <>
          <form onSubmit={saveMove} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Insumo</label>
              <select required value={move.itemId} onChange={(e) => setMove({ ...move, itemId: e.target.value })} className={input}>
                <option value="">Elige un insumo</option>
                {active.map(i => <option key={i.id} value={i.id}>{i.name} ({i.stock} {i.unit})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={move.type} onChange={(e) => setMove({ ...move, type: e.target.value })} className={input}>
                <option value="IN">Entrada (compra)</option>
                <option value="OUT">Salida (uso)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input required type="number" min="1" value={move.quantity}
                onChange={(e) => setMove({ ...move, quantity: e.target.value })} className={input} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input value={move.notes} onChange={(e) => setMove({ ...move, notes: e.target.value })} className={input} />
            </div>
            <button type="submit" disabled={saving}
              className="bg-dental-600 text-white px-6 py-2 rounded-lg hover:bg-dental-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Registrar'}
            </button>
          </form>

          <div className="bg-white rounded-xl shadow p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Fecha</th><th className="pb-2">Insumo</th>
                  <th className="pb-2">Tipo</th><th className="pb-2 text-right">Cantidad</th><th className="pb-2">Notas</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-6">Sin movimientos.</td></tr>
                ) : movements.map(m => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-2">{new Date(m.createdAt).toLocaleString('es')}</td>
                    <td className="py-2">{m.item.name}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        m.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {m.type === 'IN' ? 'Entrada' : 'Salida'}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium">{m.type === 'IN' ? '+' : '-'}{m.quantity}</td>
                    <td className="py-2">{m.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'suppliers' && (
        <>
          <form onSubmit={saveSupplier} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input required value={supplier.name} onChange={(e) => setSupplier({ ...supplier, name: e.target.value })} className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input value={supplier.phone} onChange={(e) => setSupplier({ ...supplier, phone: e.target.value })} className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
              <input type="email" value={supplier.email} onChange={(e) => setSupplier({ ...supplier, email: e.target.value })} className={input} />
            </div>
            <button type="submit" disabled={saving}
              className="bg-dental-600 text-white px-6 py-2 rounded-lg hover:bg-dental-700 disabled:opacity-50">
              + Agregar
            </button>
          </form>

          <div className="bg-white rounded-xl shadow p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Proveedor</th><th className="pb-2">Teléfono</th><th className="pb-2">Correo</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-gray-400 py-6">Sin proveedores.</td></tr>
                ) : suppliers.map(s => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{s.name}</td>
                    <td className="py-2">{s.phone || '—'}</td>
                    <td className="py-2">{s.email || '—'}</td>
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
