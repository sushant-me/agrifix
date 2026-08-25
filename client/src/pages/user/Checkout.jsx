import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    customerName: user?.username || '',
    customerPhone: user?.phone_number || '',
    deliveryAddress: user?.delivery_address || '',
    notes: '',
    paymentMethod: 'cod',
  });

  const load = async () => {
    try {
      const res = await api.get('/cart');
      setData(res.data.data);
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/orders', form);
      const { redirect, batch } = res.data;
      if (redirect.includes('khalti')) {
        navigate(`/payment/khalti?batch=${batch}`);
      } else {
        navigate('/my-orders?flash=placed');
      }
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="page-loader">Loading checkout…</div>;
  if (!data.items.length) return <Navigate to="/cart" replace />;

  return (
    <div className="grid-2">
      <div className="card">
        <h3>Order Summary</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              {data.items.map((i) => (
                <tr key={i.id}>
                  <td>{i.product_name}<div className="muted small">{i.seller_name}</div></td>
                  <td>{i.quantity}</td>
                  <td>₹{Number(i.price).toFixed(2)}</td>
                  <td>₹{(Number(i.price) * Number(i.quantity)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan="3" className="text-right" style={{ textAlign: 'right' }}>Subtotal</td><td>₹{data.subtotal.toFixed(2)}</td></tr>
              <tr><td colSpan="3" className="text-right" style={{ textAlign: 'right' }}>Tax (5%)</td><td>₹{data.tax.toFixed(2)}</td></tr>
              <tr><td colSpan="3" className="text-right" style={{ textAlign: 'right' }}><strong>Total</strong></td><td><strong>₹{data.total.toFixed(2)}</strong></td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      <form className="card" onSubmit={submit}>
        <h3>Delivery & Payment</h3>
        <label>Full Name</label>
        <input type="text" value={form.customerName} onChange={set('customerName')} required />
        <label>Phone</label>
        <input type="tel" pattern="\d{10}" title="10-digit phone number" value={form.customerPhone} onChange={set('customerPhone')} required />
        <label>Delivery Address</label>
        <textarea value={form.deliveryAddress} onChange={set('deliveryAddress')} required />
        <label>Notes (optional)</label>
        <textarea value={form.notes} onChange={set('notes')} />
        <label>Payment Method</label>
        <div className="form-row">
          <label style={{ fontWeight: 400 }}>
            <input type="radio" name="payment" value="cod" checked={form.paymentMethod === 'cod'} onChange={set('paymentMethod')} /> Cash on Delivery
          </label>
          <label style={{ fontWeight: 400 }}>
            <input type="radio" name="payment" value="khalti" checked={form.paymentMethod === 'khalti'} onChange={set('paymentMethod')} /> Khalti
          </label>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <button className="btn btn-primary btn-block mt-3" disabled={busy}>
          {busy ? 'Placing order…' : `Place Order — ₹${data.total.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}