import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client.js';

const FLOW = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

export default function TrackOrder() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/orders/${id}/tracking`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="page-loader">Loading tracking…</div>;

  const { order, tracking } = data;
  const cancelled = order.status === 'cancelled';
  const currentIndex = FLOW.indexOf(order.status);

  return (
    <div className="card">
      <h3>Tracking — Order #{order.id}</h3>
      <p className="muted small">
        {order.payment_method === 'khalti' ? 'Khalti (paid online)' : 'Cash on delivery'} · {order.payment_status || 'pending'} · Total ₹{Number(order.total_amount).toFixed(2)}
      </p>

      {cancelled ? (
        <div className="alert alert-danger">This order was cancelled.</div>
      ) : (
        <div className="stepper">
          {FLOW.map((s, i) => (
            <span
              key={s}
              className={`step ${i < currentIndex ? 'done' : ''} ${i === currentIndex ? 'current' : ''}`}
            >
              {s.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}

      <hr className="divider" />
      <h4>Timeline</h4>
      {!tracking.length && <p className="muted">No tracking events yet.</p>}
      {[...tracking].reverse().map((t, i) => (
        <div key={i} className="mb-2">
          <span className="badge info">{t.status}</span>{' '}
          <span className="small muted">{new Date(t.created_at).toLocaleString()}</span>
          <div className="small">{t.note}{t.changed_by_name ? ` — by ${t.changed_by_name}` : ''}</div>
        </div>
      ))}
    </div>
  );
}