import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client.js';

export default function Cart() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState({});

  const load = async () => {
    try {
      const res = await api.get('/cart');
      setData(res.data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const changeQty = async (item, qty) => {
    if (!qty || qty < 1) return;
    try {
      await api.patch(`/cart/items/${item.id}`, { quantity: Number(qty) });
      await load();
    } catch (err) {
      setError(err.message);
      await load();
    }
  };

  const remove = async (id) => {
    await api.delete(`/cart/items/${id}`);
    await load();
  };

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="page-loader">Loading cart…</div>;

  const { items, subtotal, tax, total } = data;

  if (!items.length) {
    return (
      <div className="card text-center">
        <h3>Your cart is empty</h3>
        <p className="muted">Browse the marketplace and add some products.</p>
        <Link to="/marketplace" className="btn btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="grid-2">
      <div className="card">
        <h3>My Cart ({items.length})</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/product/${item.product_id}`}>{item.product_name}</Link>
                    <div className="muted small">{item.seller_name} · {item.unit}</div>
                    {Number(item.quantity_available) < 5 && (
                      <div className="small" style={{ color: '#b45309' }}>Only {item.quantity_available} left</div>
                    )}
                  </td>
                  <td>₹{Number(item.price).toFixed(2)}</td>
                  <td style={{ width: 90 }}>
                    <input
                      type="number"
                      min="1"
                      max={item.quantity_available}
                      value={editing[item.id] ?? item.quantity}
                      onChange={(e) => setEditing({ ...editing, [item.id]: e.target.value })}
                      onBlur={(e) => {
                        const q = Number(e.target.value);
                        if (q !== Number(item.quantity)) changeQty(item, q);
                      }}
                    />
                  </td>
                  <td>₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                  <td>
                    <button className="btn-ghost btn-sm" onClick={() => remove(item.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Order Summary</h3>
        <table>
          <tbody>
            <tr><td>Subtotal</td><td className="text-right" style={{ textAlign: 'right' }}>₹{subtotal.toFixed(2)}</td></tr>
            <tr><td>Shipping</td><td className="text-right" style={{ textAlign: 'right' }}>Free</td></tr>
            <tr><td>Tax (5%)</td><td className="text-right" style={{ textAlign: 'right' }}>₹{tax.toFixed(2)}</td></tr>
            <tr><td><strong>Total</strong></td><td className="text-right" style={{ textAlign: 'right' }}><strong>₹{total.toFixed(2)}</strong></td></tr>
          </tbody>
        </table>
        <button className="btn btn-primary btn-block mt-3" onClick={() => navigate('/checkout')}>
          Proceed to Checkout
        </button>
        <Link to="/marketplace" className="btn btn-ghost btn-block mt-3">Continue Shopping</Link>
      </div>
    </div>
  );
}