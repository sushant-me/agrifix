import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import { Plus, X, ImagePlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const CATEGORIES = ['vegetables', 'fruits', 'grains', 'dairy', 'seeds', 'fertilizers', 'equipment', 'other'];
const UNITS = ['kg', 'litre', 'bags', 'pieces', 'tons', 'bundles'];
const MAX_IMAGES = 4;

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    productName: '', category: 'vegetables', location: '', description: '',
    price: '', unit: 'kg', quantity: '', isOrganic: false,
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const product = res.data.data.product;
        setForm({
          productName: product.product_name,
          category: product.category,
          location: product.location,
          description: product.description || '',
          price: product.price,
          unit: product.unit,
          quantity: product.quantity_available,
          isOrganic: product.is_organic === 1,
        });
        setExistingImages(res.data.data.gallery || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pickImages = (e) => {
    const picked = Array.from(e.target.files || []).slice(0, MAX_IMAGES - files.length - existingImages.length);
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_IMAGES - existingImages.length));
    e.target.value = '';
  };

  const removeImage = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const removeExistingImage = async (imageId) => {
    try {
      await api.delete(`/products/${id}/images/${imageId}`);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      setSuccess('Image removed successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);

    try {
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

      await api.patch(`/products/${id}`, fd);
      setSuccess('Product updated successfully!');
      
      // Refresh product data
      const res = await api.get(`/products/${id}`);
      const product = res.data.data.product;
      setForm({
        productName: product.product_name,
        category: product.category,
        location: product.location,
        description: product.description || '',
        price: product.price,
        unit: product.unit,
        quantity: product.quantity_available,
        isOrganic: product.is_organic === 1,
      });
      setExistingImages(res.data.data.gallery || []);
      setFiles([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="form-card wide"><div className="muted">Loading product...</div></div>;
  }

  if (user && user.role !== 'farmer') {
    return (
      <div className="form-card wide">
        <h3>Edit Product</h3>
        <div className="alert alert-warning">Only farmers can edit products.</div>
      </div>
    );
  }

  return (
    <div className="form-card wide">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button 
          type="button" 
          className="btn btn-ghost" 
          onClick={() => navigate(-1)}
          style={{ padding: 8 }}
        >
          <ArrowLeft size={18} />
        </button>
        <h3 style={{ margin: 0 }}>Edit Product</h3>
      </div>
      
      <p className="muted">Update your product details and images.</p>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <form onSubmit={submit}>
        <label>
          Product Photos 
          <span className="muted small">
            ({existingImages.length + files.length}/{MAX_IMAGES} images — the first one is the cover)
          </span>
        </label>
        
        <div className="photo-picker">
          {existingImages.map((img) => (
            <div className="photo-thumb" key={img.id}>
              <img src={img.url} alt={`Product photo ${img.id}`} />
              <button 
                type="button" 
                className="photo-remove" 
                onClick={() => removeExistingImage(img.id)} 
                aria-label="Remove photo"
              >
                <X size={14} />
              </button>
              {img.id === existingImages[0]?.id && <span className="photo-cover">Cover</span>}
            </div>
          ))}
          
          {previews.map((src, i) => (
            <div className="photo-thumb" key={src}>
              <img src={src} alt={`New product photo ${i + 1}`} />
              <button type="button" className="photo-remove" onClick={() => removeImage(i)} aria-label="Remove photo">
                <X size={14} />
              </button>
              {!existingImages.length && i === 0 && <span className="photo-cover">Cover</span>}
            </div>
          ))}
          
          {existingImages.length + files.length < MAX_IMAGES && (
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
            <input type="text" value={form.productName} onChange={set('productName')} required minLength={3} />
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
            <input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Karnataka" required minLength={2} />
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
            <input type="number" min="0" value={form.quantity} onChange={set('quantity')} required />
          </div>
        </div>
        
        <label>Description</label>
        <textarea 
          value={form.description} 
          onChange={set('description')} 
          maxLength={2000}
          placeholder="Describe your product..."
        />
        
        <label style={{ fontWeight: 400, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input 
            type="checkbox" 
            checked={form.isOrganic} 
            onChange={(e) => setForm({ ...form, isOrganic: e.target.checked })} 
          />
          Organic produce
        </label>
        
        <button className="btn btn-primary btn-block mt-3" disabled={busy}>
          {busy ? 'Updating…' : 'Update Product'}
        </button>
      </form>
    </div>
  );
}