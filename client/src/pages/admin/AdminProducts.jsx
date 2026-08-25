import { useEffect, useState } from 'react';
import api from '../../api/client.js';

const CATEGORIES = ['vegetables', 'fruits', 'grains', 'dairy', 'seeds', 'fertilizers', 'equipment', 'other'];
const UNITS = ['kg', 'litre', 'bags', 'pieces', 'tons', 'bundles'];

const EMPTY = {
  id: 0, sellerId: '', productName: '', category: 'vegetables', description: '',
  price: '', quantityAvailable: '', unit: 'kg', location: '', isOrganic: false, currentImageUrl: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () =>
    api.get('/admin/products')
      .then((res) => setProducts(res.data.data))
      .catch((err) => setError(err.message));

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const edit = (p) => {
    setForm({
      id: p.id, sellerId: p.seller_id, productName: p.product_name, category: p.category,
      description: p.description || '', price: p.price, quantityAvailable: p.quantity_available,
      unit: p.unit, location: p.location, isOrganic: p.is_organic == 1, currentImageUrl: p.image_url || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    const fd = new FormData();
    fd.append('id', form.id);
    fd.append('sellerId', form.sellerId);
    fd.append('productName', form.productName);
    fd.append('category', form.category);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('quantityAvailable', form.quantityAvailable);
    fd.append('unit', form.unit);
    fd.append('location', form.location);
    fd.append('isOrganic', form.isOrganic ? '1' : '0');
    fd.append('currentImageUrl', form.currentImageUrl || '');
    if (file) fd.append('productImage', file);
    try {
      await api.post('/admin/products', fd);
      setNotice(form.id ? 'Product updated.' : 'Product created.');
      setForm(EMPTY);
      setFile(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.product_name}"?`)) return;
    try {
      await api.delete(`/admin/products/${p.id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid-2">
      <div className="card">
        <h3>{form.id ? `Edit Product #${form.id}` : 'Add Product'}</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}
        <form onSubmit={save}>
          <label>Seller ID *</label>
          <input type="number" value={form.sellerId} onChange={set('sellerId')} required />
          <div className="form-row">
            <div>
              <label>Name *</label>
              <input type="text" value={form.productName} onChange={set('productName')} required />
            </div>
            <div>
              <label>Category</label>
              <select value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div>
              <label>Price (₹) *</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required />
            </div>
            <div>
              <label>Quantity *</label>
              <input type="number" min="0" value={form.quantityAvailable} onChange={set('quantityAvailable')} required />
            </div>
          </div>
          <div className="form-row">
            <div>
              <label>Unit</label>
              <select value={form.unit} onChange={set('unit')}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label>Location</label>
              <input type="text" value={form.location} onChange={set('location')} />
            </div>
          </div>
          <label>Description</label>
          <textarea value={form.description} onChange={set('description')} />
          <label style={{ fontWeight: 400, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={form.isOrganic} onChange={(e) => setForm({ ...form, isOrganic: e.target.checked })} />
            Organic
          </label>
          <label>Image (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
          {form.currentImageUrl && <p className="small muted">Current: {form.currentImageUrl}</p>}
          <button className="btn btn-primary btn-block mt-3">{form.id ? 'Update Product' : 'Create Product'}</button>
        </form>
      </div>

      <div className="card">
        <h3>Products ({products?.length || 0})</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Seller</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {!products && <tr><td colSpan="7" className="muted">Loading…</td></tr>}
              {products?.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.product_name}{p.image_url ? ' 📷' : ''}</td>
                  <td className="small">{p.seller_name} (#{p.seller_id})</td>
                  <td><span className="badge info">{p.category}</span></td>
                  <td>₹{Number(p.price).toFixed(2)}</td>
                  <td>{p.quantity_available}</td>
                  <td>
                    <div className="actions-inline">
                      <button className="btn-ghost btn-sm" onClick={() => edit(p)}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}