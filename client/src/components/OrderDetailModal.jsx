import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  X, MessageCircle, MapPin, Phone, Wallet, Banknote, CheckCircle2,
  XCircle, Save, Truck, Clock, CircleUser, Trash2,
} from 'lucide-react';

const FLOW = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const FINAL = ['delivered', 'cancelled'];

const STATUS_BADGE = {
  pending: 'warning', confirmed: 'info', processing: 'info', packed: 'info',
  shipped: 'info', out_for_delivery: 'info', delivered: 'success', cancelled: 'danger',
};

const STATUS_LABEL = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing', packed: 'Packed',
  shipped: 'Shipped', out_for_delivery: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};

function npr(n) {
  return `रू ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function OrderDetailModal({ orderId, onClose, onChanged }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!orderId) return;
    setError('');
    setSaving(false);
    setDraft('');
    setOrder(null);
    api.get(`/orders/${orderId}`)
      .then((r) => {
        setOrder(r.data.data.order);
        setItems(r.data.data.items || []);
      })
      .catch((e) => setError(e.message));
    api.get(`/orders/${orderId}/tracking`)
      .then((r) => setTracking(r.data.data.tracking || []))
      .catch(() => {});
  }, [orderId]);

  if (!orderId) return null;
  if (!order) {
    return (
      <div className="odm-backdrop" onClick={onClose}>
        <div className="odm-panel" onClick={(e) => e.stopPropagation()}>
          <div className="odm-body">{error ? <div className="alert alert-danger">{error}</div> : <div className="page-loader">Loading order…</div>}</div>
        </div>
      </div>
    );
  }

  const canManage = (user.role === 'farmer' || user.role === 'vendor') && Number(order.seller_id) === user.id;
  const isFinal = FINAL.includes(order.status);
  const lastEvent = tracking[tracking.length - 1];

  const updateStatus = async (status) => {
    if (!window.confirm(`Mark order #${order.id} as "${STATUS_LABEL[status] || status}"?`)) return;
    setSaving(true);
    setError('');
    try {
      await api.post(`/admin/farmer/orders/${order.id}/status`, { status });
      const refetch = await api.get(`/orders/${order.id}`);
      setOrder(refetch.data.data.order);
      setItems(refetch.data.data.items || []);
      const tr = await api.get(`/orders/${order.id}/tracking`);
      setTracking(tr.data.data.tracking || []);
      setDraft('');
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openChat = async () => {
    try {
      const conv = await api.post('/conversations', { farmerId: order.buyer_id });
      navigate(`/user-profile?tab=chats&chat=${conv.data.data.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteOrder = async () => {
    if (!window.confirm(`Delete order #${order.id}? This removes it from both sides and cannot be undone.`)) return;
    setError('');
    try {
      await api.delete(`/admin/farmer/orders/${order.id}`);
      onChanged?.();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="odm-backdrop" onClick={onClose}>
      <div className="odm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="odm-head">
          <div>
            <h3 style={{ margin: 0 }}>Order #{order.id}</h3>
            <div className="small muted">
              Placed {new Date(order.order_date).toLocaleString()}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge ${STATUS_BADGE[order.status] || 'info'}`}>{STATUS_LABEL[order.status] || order.status}</span>
            <button className="odm-close" onClick={onClose} title="Close"><X size={17} /></button>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="odm-body">
          <div className="odm-grid">
            <div className="odm-buyer-card">
              <div className="odm-buyer-top">
                <div className="odm-avatar">
                  {order.buyer_avatar ? (
                    <img src={order.buyer_avatar} alt={order.buyer_name || 'buyer'} />
                  ) : (
                    <CircleUser size={26} />
                  )}
                </div>
                <div>
                  <div className="odm-buyer-name">{order.buyer_name || order.customer_name || 'Buyer'}</div>
                  {order.buyer_name && <div className="small muted">@{order.buyer_name}</div>}
                </div>
              </div>
              <div className="odm-buyer-detail"><Phone size={14} /> {order.customer_phone}</div>
              <div className="odm-buyer-detail"><MapPin size={14} /> {order.delivery_address}</div>
              {order.notes && <div className="odm-buyer-detail muted"><Truck size={14} /> Notes: {order.notes}</div>}
              <div className="odm-buyer-detail">
                {order.payment_method === 'khalti' ? (
                  <span className="badge success"><Wallet size={11} style={{ verticalAlign: '-1px' }} /> Khalti · paid</span>
                ) : (
                  <span className="badge info"><Banknote size={11} style={{ verticalAlign: '-1px' }} /> Cash on delivery</span>
                )}
                {order.khalti_transaction_id && (
                  <span className="small muted"> · TX {order.khalti_transaction_id}</span>
                )}
              </div>
            </div>

            <div className="odm-timeline">
              <h4 className="odm-section-title"><Clock size={14} style={{ verticalAlign: '-2px' }} /> Tracking</h4>
              {tracking.length === 0 && <div className="muted small">No tracking events yet.</div>}
              <div className="odm-tl-list">
                {tracking.map((ev, i) => (
                  <div key={i} className={`odm-tl-item ${i === tracking.length - 1 ? 'current' : ''}`}>
                    <div className="odm-tl-dot" />
                    <div>
                      <div className="small"><strong>{STATUS_LABEL[ev.status] || ev.status}</strong> {ev.note ? `— ${ev.note}` : ''}</div>
                      <div className="odm-tl-meta">{new Date(ev.created_at).toLocaleString()}{ev.changed_by_name ? ` · ${ev.changed_by_name}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h4 className="odm-section-title">Items ({items.length})</h4>
          <div className="odm-items">
            {items.map((it) => (
              <div key={it.id} className="odm-item">
                {it.image_url ? (
                  <img className="odm-item-img" src={it.image_url} alt={it.product_name} />
                ) : (
                  <div className="odm-item-img odm-item-img-empty" />
                )}
                <div style={{ flex: 1 }}>
                  <div className="small">{it.product_name}</div>
                  <div className="small muted">{it.quantity} × {npr(it.price_per_unit)}{it.unit ? ` /${it.unit}` : ''}</div>
                </div>
                <div className="small" style={{ fontWeight: 600 }}>{npr(Number(it.quantity) * Number(it.price_per_unit))}</div>
              </div>
            ))}
          </div>

          <div className="odm-total">
            <span>Total</span>
            <span>{npr(order.total_amount)}</span>
          </div>

          {canManage && !isFinal && (
            <div className="odm-actions">
              <div className="odm-actions-label">Manage order</div>
              <div className="odm-actions-row">
                <button className="btn-success btn-sm" disabled={saving} onClick={() => updateStatus('delivered')}>
                  <CheckCircle2 size={13} /> Deliver now
                </button>
                <button className="btn-danger btn-sm" disabled={saving} onClick={() => updateStatus('cancelled')}>
                  <XCircle size={13} /> Cancel order
                </button>
                <div className="odm-flow">
                  <select value={draft} onChange={(e) => setDraft(e.target.value)}>
                    <option value="">Update flow…</option>
                    {FLOW.slice(0, 7).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                  <button className="btn-primary btn-sm" disabled={!draft || saving} onClick={() => updateStatus(draft)}>
                    <Save size={13} />
                  </button>
                </div>
                <button className="btn-ghost btn-sm" onClick={openChat}>
                  <MessageCircle size={13} /> Chat with buyer
                </button>
              </div>
            </div>
          )}
          {canManage && isFinal && (
            <div className="odm-actions">
              <div className="odm-actions-row">
                <button className="btn-ghost btn-sm" onClick={openChat}>
                  <MessageCircle size={13} /> Chat with buyer
                </button>
                {lastEvent && <span className="small muted">{STATUS_LABEL[order.status]} {new Date(lastEvent.created_at).toLocaleString()}</span>}
              </div>
            </div>
          )}
          {canManage && (
            <div className="odm-actions">
              <button className="btn-danger btn-sm" onClick={deleteOrder}>
                <Trash2 size={13} /> Delete order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
