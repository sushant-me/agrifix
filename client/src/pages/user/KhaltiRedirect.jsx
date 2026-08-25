import { useEffect, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import api from '../../api/client.js';

export default function KhaltiRedirect() {
  const [params] = useSearchParams();
  const batch = params.get('batch');
  const [state, setState] = useState({ error: '', busy: true });

  useEffect(() => {
    if (!batch) return;
    api
      .get('/payments/khalti/init', { params: { batch } })
      .then((res) => {
        const { paymentUrl, alreadyPaid, redirect } = res.data.data;
        if (alreadyPaid) {
          window.location.href = redirect || '/my-orders';
        } else if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          setState({ error: 'Khalti did not return a payment URL.', busy: false });
        }
      })
      .catch((err) => setState({ error: err.message, busy: false }));
  }, [batch]);

  if (!batch) return <Navigate to="/my-orders" replace />;

  return (
    <div className="card text-center">
      <h3>Khalti Payment</h3>
      {state.busy && <p className="muted">Redirecting to Khalti…</p>}
      {state.error && <div className="alert alert-danger">{state.error}</div>}
    </div>
  );
}