import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { Plus, Trash2, Carrot, Edit } from 'lucide-react';

export default function FarmerProducts() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () =>
    api.get('/admin/farmer/products')
      .then((r) => setProducts(r.data.data))
      .catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.product_name}"? This removes it from the marketplace.`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/admin/farmer/products/${p.id}`);
      setNotice('Product deleted.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ margin: 0 }}>My products ({products ? products.length : '…'})</h3>
          <Link to="/add-product" className="btn btn-primary btn-sm"><Plus size={15} /> List a product</Link>
        </div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>Qty</th><th>Organic</th><th>Listed</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products && !products.length && <tr><td colSpan="8" className="muted">No products yet — list your first one.</td></tr>}
              {products && products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.product_name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border-strong)' }} />
                      : <span className="product-thumb" style={{ width: 44, height: 44, borderRadius: 4 }}><Carrot size={22} /></span>}
                  </td>
                  <td><strong>{p.product_name}</strong></td>
                  <td><span className="badge info">{p.category}</span></td>
                  <td>₹{Number(p.price).toFixed(2)} <span className="muted small">/ {p.unit}</span></td>
                  <td>{p.quantity_available}</td>
                  <td>{p.is_organic ? <span className="badge success">organic</span> : <span className="muted small">—</span>}</td>
                  <td className="small">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/edit-product/${p.id}`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Edit size={13} /> Edit
                      </Link>
                      <button className="btn-danger btn-sm" onClick={() => remove(p)}><Trash2 size={13} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!products && <tr><td colSpan="8" className="muted">Loading…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}