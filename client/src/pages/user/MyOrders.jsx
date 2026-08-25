import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';

const STATUSES = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const PAYMENT_BANNERS = {
  success: { type: 'alert-success', text: 'Payment successful. Thank you!' },
  already_paid: { type: 'alert-info', text: 'This payment was already completed.' },
  failed: { type: 'alert-danger', text: 'Payment failed. Please try again.' },
  batch_not_found: { type: 'alert-danger', text: 'Payment batch not found.' },
  error: { type: 'alert-danger', text: 'Payment could not be verified.' },
};

export default function MyOrders() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const payment = params.get('payment');
  const placed = params.get('placed');
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/orders', { params: status ? { status } : {} })
      .then((res) => setOrders(res.data.data))
      .catch((err) => setError(err.message));
  }, [status]);

  const banner = payment ? PAYMENT_BANNERS[payment] : null;

  return (
    <div>
      {placed && <div className="alert alert-success">Order placed successfully!</div>}
      {banner && <div className={`alert ${banner.type}`}>{banner.text}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="actions-inline mb-2">
        <button className={`btn-ghost btn-sm ${!status ? 'btn-primary' : ''}`} onClick={() => setParams({})}>All</button>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`btn-ghost btn-sm ${status === s ? 'btn-primary' : ''}`}
            onClick={() => setParams({ status: s })}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {!orders && !error && <div className="page-loader">Loading orders…</div>}

      {orders && !orders.length && (
        <div className="card text-center">
          <h3>No orders found</h3>
          <Link to="/marketplace" className="btn btn-primary">Browse Marketplace</Link>
        </div>
      )}

      {orders?.map((o) => (
        <div className="order-card" key={o.id}>
          <div className="head">
            <strong>Order #{o.id}</strong>
            <span className="muted small">{new Date(o.order_date).toLocaleString()}</span>
          </div>
          <div className="muted small mb-1">{o.items_preview || '—'}</div>
          <div className="actions-inline mb-1">
            <span className="badge info">{o.status}</span>
            <span className="badge warning">{o.payment_method}</span>
            <span className={`badge ${o.payment_status === 'paid' ? 'success' : 'danger'}`}>{o.payment_status}</span>
          </div>
          <div className="actions-inline">
            <strong>₹{Number(o.total_amount).toFixed(2)}</strong>
            <Link to={`/order/${o.id}`} className="btn-ghost btn-sm">Details</Link>
            <Link to={`/track-order/${o.id}`} className="btn-ghost btn-sm">Track</Link>
          </div>
        </div>
      ))}
    </div>
  );
}