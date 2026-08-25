import { useEffect, useState } from 'react';
import api from '../../api/client.js';

const STATUSES = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const PAY_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [filters, setFilters] = useState({ status: '', paymentMethod: '', paymentStatus: '', date: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    api.get('/admin/orders', { params })
      .then((res) => setOrders(res.data.data))
      .catch((err) => setError(err.message));
  };

  useEffect(() => { load(); }, [filters]);

  const setFilter = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  const update = async (o, payload) => {
    try {
      await api.post(`/admin/orders/${o.id}/status`, payload);
      setNotice(`Order #${o.id} updated.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card">
      <h3>Orders, Tracking & Payments</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="filter-bar">
        <div className="field">
          <label className="small">Status</label>
          <select value={filters.status} onChange={setFilter('status')}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="small">Payment Method</label>
          <select value={filters.paymentMethod} onChange={setFilter('paymentMethod')}>
            <option value="">All</option>
            <option value="cod">COD</option>
            <option value="khalti">Khalti</option>
          </select>
        </div>
        <div className="field">
          <label className="small">Payment Status</label>
          <select value={filters.paymentStatus} onChange={setFilter('paymentStatus')}>
            <option value="">All</option>
            {PAY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="small">Order Date</label>
          <input type="date" value={filters.date} onChange={setFilter('date')} />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Date</th><th>Buyer</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {!orders && <tr><td colSpan="8" className="muted">Loading…</td></tr>}
            {orders?.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td className="small">{new Date(o.order_date).toLocaleDateString()}</td>
                <td className="small">{o.buyer_name || '—'}</td>
                <td className="small">
                  {o.customer_name}<br />
                  <span className="muted">{o.customer_phone}</span>
                  <div className="muted" style={{ maxWidth: 180 }}>{o.delivery_address}</div>
                </td>
                <td>₹{Number(o.total_amount).toFixed(2)}</td>
                <td><span className="badge info">{o.status}</span></td>
                <td className="small">
                  <span className={`badge ${o.payment_status === 'paid' ? 'success' : 'danger'}`}>{o.payment_method} · {o.payment_status}</span>
                  {o.khalti_transaction_id && <div className="muted">txn {o.khalti_transaction_id}</div>}
                </td>
                <td>
                  <OrderEditor key={o.id} order={o} onUpdate={update} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderEditor({ order, onUpdate }) {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await onUpdate(order, { status, paymentStatus, note: note || undefined });
    setBusy(false);
  };

  const confirmCod = async () => {
    setBusy(true);
    await onUpdate(order, { confirmCodPayment: '1' });
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
        {PAY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input type="text" placeholder="Admin note" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="actions-inline">
        <button className="btn-primary btn-sm" onClick={submit} disabled={busy}>Update</button>
        {order.payment_method === 'cod' && (
          <button className="btn-warning btn-sm" onClick={confirmCod} disabled={busy}>Confirm COD</button>
        )}
      </div>
    </div>
  );
}