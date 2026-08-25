import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client.js';
import {
  Save, CheckCircle2, XCircle, Banknote, Wallet, PackageCheck, PackageX, IndianRupee, Trash2,
} from 'lucide-react';
import OrderDetailModal from '../../components/OrderDetailModal.jsx';

const FLOW = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const ACTIVE = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'];

const STATUS_BADGE = {
  pending: 'warning', confirmed: 'info', processing: 'info', packed: 'info',
  shipped: 'info', out_for_delivery: 'info', delivered: 'success', cancelled: 'danger',
};

const STATUS_LABEL = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing', packed: 'Packed',
  shipped: 'Shipped', out_for_delivery: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};

const FILTERS = [
  ['', 'All'],
  ['active', 'Pending delivery'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
];

function npr(n) {
  return `रू ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function FarmerOrdersBoard({ mode = 'sales' }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('');
  const [activeOrderId, setActiveOrderId] = useState(null);

  const load = () =>
    api.get('/admin/farmer/orders')
      .then((r) => setOrders(r.data.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const setStatus = async (o, status) => {
    if (status === o.status) return;
    if (!window.confirm(`Mark order #${o.id} as "${STATUS_LABEL[status] || status}"?`)) return;
    setError('');
    setNotice('');
    try {
      await api.post(`/admin/farmer/orders/${o.id}/status`, { status });
      setNotice(`Order #${o.id} is now ${status}. The buyer can see it in their tracking.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteOrder = async (o) => {
    if (!window.confirm(`Delete order #${o.id}? This removes it from the seller and buyer side and cannot be undone.`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/admin/farmer/orders/${o.id}`);
      setNotice(`Order #${o.id} deleted.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const counts = useMemo(() => orders.reduce((c, o) => {
    c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, {}), [orders]);

  const pendingCount = ACTIVE.reduce((s, st) => s + (counts[st] || 0), 0);

  let visible;
  if (mode === 'results') {
    visible = orders.filter((o) => ['delivered', 'cancelled'].includes(o.status));
  } else if (mode === 'current') {
    visible = orders.filter((o) => ACTIVE.includes(o.status));
  } else {
    visible = !filter ? orders : orders.filter((o) =>
      filter === 'active' ? ACTIVE.includes(o.status) : o.status === filter
    );
  }

  const deliveredAmount = orders
    .filter((o) => o.status === 'delivered')
    .reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const cancelledAmount = orders
    .filter((o) => o.status === 'cancelled')
    .reduce((s, o) => s + Number(o.total_amount || 0), 0);

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}
      <OrderDetailModal orderId={activeOrderId} onClose={() => setActiveOrderId(null)} onChanged={load} />

      {mode === 'current' && (
        <div className="odm-summary-row">
          <div className="odm-summary-card">
            <PackageCheck size={18} />
            <div><div className="num">{pendingCount}</div><div className="label">Waiting for delivery</div></div>
          </div>
          <div className="odm-summary-card">
            <IndianRupee size={18} />
            <div><div className="num">{npr(orders.filter((o) => ACTIVE.includes(o.status)).reduce((s, o) => s + Number(o.total_amount || 0), 0))}</div><div className="label">Value of current orders</div></div>
          </div>
        </div>
      )}

      {mode === 'results' && (
        <div className="odm-summary-row">
          <div className="odm-summary-card good">
            <PackageCheck size={18} />
            <div><div className="num">{counts.delivered || 0}</div><div className="label">Successful deliveries</div></div>
          </div>
          <div className="odm-summary-card good">
            <IndianRupee size={18} />
            <div><div className="num">{npr(deliveredAmount)}</div><div className="label">Earned from deliveries</div></div>
          </div>
          <div className="odm-summary-card bad">
            <PackageX size={18} />
            <div><div className="num">{counts.cancelled || 0}</div><div className="label">Unsuccessful orders</div></div>
          </div>
          <div className="odm-summary-card bad">
            <IndianRupee size={18} />
            <div><div className="num">{npr(cancelledAmount)}</div><div className="label">Lost to cancellations</div></div>
          </div>
        </div>
      )}

      {mode === 'sales' && !loading && (
        <div className="admin-fa-tabs" style={{ marginBottom: 12 }}>
          {FILTERS.map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`admin-fa-tab ${filter === val ? 'active' : ''}`}
              onClick={() => setFilter(val)}
            >
              {label}
              {val === 'active' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>
          {mode === 'current'
            ? `Current orders (${visible.length})`
            : mode === 'results'
              ? `Order results (${visible.length})`
              : `${FILTERS.find(([v]) => v === filter)?.[1] || 'All orders'} (${visible.length})`}
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Items</th><th>Buyer</th><th>Delivery</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th><th>&nbsp;</th></tr>
            </thead>
            <tbody>
              {!loading && !visible.length && <tr><td colSpan="9" className="muted">
                {mode === 'current' ? 'No orders waiting for delivery right now.' : 'No orders in this view yet.'}
              </td></tr>}
              {visible.map((o) => {
                const isActive = ACTIVE.includes(o.status);
                return (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setActiveOrderId(o.id)}>
                    <td>#{o.id}<div className="small muted">{new Date(o.order_date).toLocaleString()}</div></td>
                    <td className="small" style={{ maxWidth: 220 }}>{o.items_preview || '—'}</td>
                    <td className="small">{o.customer_name}<div className="muted">{o.customer_phone}</div></td>
                    <td className="small" style={{ maxWidth: 180 }}>{o.delivery_address}</td>
                    <td>{npr(o.total_amount)}</td>
                    <td>
                      {o.payment_method === 'khalti' ? (
                        <span className="badge success"><Wallet size={11} style={{ verticalAlign: '-1px' }} /> Khalti · paid</span>
                      ) : (
                        <span className="badge info"><Banknote size={11} style={{ verticalAlign: '-1px' }} /> Cash on delivery</span>
                      )}
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[o.status] || 'info'}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {o.status === 'delivered' || o.status === 'cancelled' ? (
                        <span className="muted small">View</span>
                      ) : (
                        <div className="actions-inline" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 5 }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-success btn-sm" title="Deliver now" onClick={() => setStatus(o, 'delivered')}>
                              <CheckCircle2 size={13} /> Deliver
                            </button>
                            <button className="btn-danger btn-sm" title="Cancel order" onClick={() => setStatus(o, 'cancelled')}>
                              <XCircle size={13} /> Cancel
                            </button>
                          </div>
                          {isActive && (
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                              <select
                                value={draft[o.id] ?? o.status}
                                onChange={(e) => setDraft({ ...draft, [o.id]: e.target.value })}
                                style={{ width: 118 }}
                              >
                                {FLOW.slice(0, 7).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                              </select>
                              <button className="btn-primary btn-sm" disabled={!draft[o.id] || draft[o.id] === o.status} onClick={() => setStatus(o, draft[o.id])}>
                                <Save size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="btn-ghost btn-sm" title="Delete order" onClick={() => deleteOrder(o)}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted small" style={{ margin: '10px 0 0' }}>
          Click any order to open the full tracking detail — buyer address, payment, timeline, and chat.
        </p>
      </div>
    </div>
  );
}