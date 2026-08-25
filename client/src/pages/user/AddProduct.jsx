import { useState, useRef, useEffect } from 'react';
import api from '../../api/client.js';
import { Plus, X, ImagePlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const CATEGORIES = ['vegetables', 'fruits', 'grains', 'dairy', 'seeds', 'fertilizers', 'equipment', 'other'];
const UNITS = ['kg', 'litre', 'bags', 'pieces', 'tons', 'bundles'];
const MAX_IMAGES = 4;

export default function AddProduct() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    productName: '', category: 'vegetables', location: '', description: '',
    price: '', unit: 'kg', quantity: '', isOrganic: false,
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pickImages = (e) => {
    const picked = Array.from(e.target.files || []).slice(0, MAX_IMAGES - files.length);
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
    e.target.value = '';
  };

  const removeImage = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!files.length) {
      setError('Add at least one product photo (up to 4).');
      return;
    }
    setBusy(true);
    const fd = new FormData();
    fd.append('productName', form.productName);
    fd.append('category', form.category);
    fd.append('location', form.location);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('unit', form.unit);
    fd.append('quantity', form.quantity);
    fd.append('isOrganic', form.isOrganic ? '1' : '0');
    files.forEach((f) => fd.append('productImages', f));
    try {
      await api.post('/products', fd);
      setSuccess('Product added successfully!');
      setForm({ productName: '', category: 'vegetables', location: '', description: '', price: '', unit: 'kg', quantity: '', isOrganic: false });
      setFiles([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (user && user.role !== 'farmer') {
    return (
      <div className="form-card wide">
        <h3>Sell a Product</h3>
        <div className="alert alert-warning">Only farmers can list products on the marketplace.</div>
      </div>
    );
  }

  return (
    <div className="form-card wide">
      <h3>Sell a Product</h3>
      <p className="muted">List your produce on the AgriSmart marketplace.</p>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={submit}>
        <label>Product Photos <span className="muted small">(1–4 images — the first one is the cover)</span></label>
        <div className="photo-picker">
          {previews.map((src, i) => (
            <div className="photo-thumb" key={src}>
              <img src={src} alt={`Product photo ${i + 1}`} />
              <button type="button" className="photo-remove" onClick={() => removeImage(i)} aria-label="Remove photo">
                <X size={14} />
              </button>
              {i === 0 && <span className="photo-cover">Cover</span>}
            </div>
          ))}
          {files.length < MAX_IMAGES && (
            <button type="button" className="photo-add" onClick={() => fileRef.current?.click()}>
              <ImagePlus size={20} />
              Add photo
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={pickImages}
          style={{ display: 'none' }}
        />
        <div className="form-row">
          <div>
            <label>Product Name *</label>
            <input type="text" value={form.productName} onChange={set('productName')} required />
          </div>
          <div>
            <label>Category *</label>
            <select value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div>
            <label>Location *</label>
            <input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Karnataka" required />
          </div>
          <div>
            <label>Unit</label>
            <select value={form.unit} onChange={set('unit')}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
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
            <input type="number" min="1" value={form.quantity} onChange={set('quantity')} required />
          </div>
        </div>
        <label>Description</label>
        <textarea value={form.description} onChange={set('description')} />
        <label style={{ fontWeight: 400, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={form.isOrganic} onChange={(e) => setForm({ ...form, isOrganic: e.target.checked })} />
          Organic produce
        </label>
        <button className="btn btn-primary btn-block mt-3" disabled={busy}>
          {busy ? 'Adding…' : 'Add Product'}
        </button>
      </form>
    </div>
  );
}