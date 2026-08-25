import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Carrot } from 'lucide-react';

const CATEGORIES = ['vegetables', 'fruits', 'grains', 'seeds', 'fertilizers', 'equipment', 'other'];
const LOCATIONS = ['Kathmandu', 'Pokhara', 'Chitwan', 'Janakpur', 'Birgunj'];

function stars(rating) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

export default function Marketplace() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [organic, setOrganic] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    if (organic) params.set('organic', '1');

    api.get(`/products?${params.toString()}`)
      .then((res) => { if (!cancelled) setProducts(res.data.data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [debouncedSearch, category, location, organic]);

  return (
    <>
      <div className="page-head">
        <h1>Marketplace</h1>
        <p className="muted">Fresh produce and farm supplies, straight from Nepali sellers.</p>
      </div>

      <div className="filter-bar">
        <div className="field">
          <label htmlFor="search">Search</label>
          <input id="search" type="text" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="location">Location</label>
          <select id="location" value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">All Locations</option>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 8 }}>
          <input type="checkbox" checked={organic} onChange={(e) => setOrganic(e.target.checked)} />
          Organic only
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <p className="muted small" style={{ margin: 0 }}>
          {loading ? 'Loading…' : `${products.length} product${products.length === 1 ? '' : 's'} found`}
        </p>
        {user ? (
          <div className="actions-inline">
            {user.role === 'farmer' && <Link to="/add-product" className="btn btn-primary btn-sm">+ Add Product</Link>}
            <Link to="/cart" className="btn btn-ghost btn-sm">View Cart</Link>
          </div>
        ) : (
          <p className="muted small" style={{ margin: 0 }}>
            <Link to="/login">Login</Link> to add products or manage your cart.
          </p>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <p className="muted text-center">Loading products…</p>}
      {!loading && !error && products.length === 0 && (
        <div className="alert alert-info">No products found. Try adjusting your filters.</div>
      )}

      {!loading && products.length > 0 && (
        <div className="product-grid">
          {products.map((p) => (
            <div key={p.id} className="product-card">
              {p.image_url ? (
                <img src={p.image_url} alt={p.product_name} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.classList.add('thumb-fallback'); }} />
              ) : (
                <div className="product-thumb"><Carrot size={34} /></div>
              )}
              <span className="product-cat">{p.category}</span>
              <div className="product-body">
                <h4><Link to={`/product/${p.id}`}>{p.product_name}</Link></h4>
                <div className="product-meta">by {p.shop_name}</div>
                <div className="product-meta">
                  <span className="stars">{stars(p.rating)}</span> ({p.total_reviews} review{p.total_reviews === 1 ? '' : 's'})
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8, paddingTop: 8 }}>
                  <div className="product-price">₹{Number(p.price).toLocaleString()}{p.unit ? ` /${p.unit}` : ''}</div>
                  <Link to={`/product/${p.id}`} className="btn btn-primary btn-sm">View →</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}