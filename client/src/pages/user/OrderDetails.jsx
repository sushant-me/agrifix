import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client.js';

export default function OrderDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="page-loader">Loading order…</div>;

  const { order, items, tracking } = data;

  return (
    <div>
      <div className="card">
        <div className="actions-inline" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Order #{order.id}</h3>
          <div className="actions-inline">
            <span className="badge info">{order.status}</span>
            <span className="badge warning">{order.payment_method}</span>
            <span className={`badge ${order.payment_status === 'paid' ? 'success' : 'danger'}`}>{order.payment_status}</span>
          </div>
        </div>
        <p className="muted small mb-1">
          Placed {new Date(order.order_date).toLocaleString()} · Total <strong>₹{Number(order.total_amount).toFixed(2)}</strong>
        </p>
        {order.khalti_transaction_id && (
          <p className="small">Khalti txn: {order.khalti_transaction_id}</p>
        )}
        <div className="form-row">
          <div>
            <div className="muted small"><strong>Deliver to</strong></div>
            <div className="small">{order.customer_name} · {order.customer_phone}</div>
            <div className="small">{order.delivery_address}</div>
            {order.estimated_delivery_date && <div className="small muted">ETA: {order.estimated_delivery_date}</div>}
          </div>
          <div>
            <div className="muted small"><strong>Seller</strong></div>
            <div className="small">{order.seller_name}</div>
          </div>
        </div>
        {order.notes && <p className="small muted">Notes: {order.notes}</p>}
      </div>

      <div className="card">
        <h3>Items</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td><Link to={`/product/${i.product_id}`}>{i.product_name}</Link></td>
                  <td>{i.quantity} {i.unit}</td>
                  <td>₹{Number(i.price_per_unit).toFixed(2)}</td>
                  <td>₹{Number(i.total_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="actions-inline mt-3">
          <Link to={`/track-order/${order.id}`} className="btn btn-primary">Track Order</Link>
          <Link to="/my-orders" className="btn-ghost">Back to Orders</Link>
        </div>
      </div>

      <div className="card">
        <h3>Recent Tracking</h3>
        {!tracking.length && <p className="muted">No tracking events yet.</p>}
        {tracking.map((t, i) => (
          <div key={i} className="mb-1">
            <span className="badge info">{t.status}</span>{' '}
            <span className="small muted">{new Date(t.created_at).toLocaleString()}</span>
            <div className="small">{t.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}