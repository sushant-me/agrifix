import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { Carrot } from 'lucide-react';

export default function Wishlist() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    api.get('/wishlist')
      .then((res) => setItems(res.data.data))
      .catch((err) => setError(err.message));

  useEffect(() => { load(); }, []);

  const remove = async (productId) => {
    await api.delete(`/wishlist/${productId}`);
    await load();
  };

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!items) return <div className="page-loader">Loading wishlist…</div>;

  if (!items.length) {
    return (
      <div className="card text-center">
        <h3>Your wishlist is empty</h3>
        <Link to="/marketplace" className="btn btn-primary">Browse Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>My Wishlist</h3>
      <div className="product-grid">
        {items.map((i) => (
          <div className="product-card" key={i.product_id}>
            {i.image_url ? (
              <img src={`/${i.image_url}`} alt={i.product_name} />
            ) : (
              <div className="product-thumb"><Carrot size={34} /></div>
            )}
            <div className="product-body">
              <h4><Link to={`/product/${i.product_id}`}>{i.product_name}</Link></h4>
              <div className="product-price">₹{Number(i.price).toFixed(2)} <span className="muted small">/ {i.unit}</span></div>
              <div className="actions-inline">
                <Link to={`/product/${i.product_id}`} className="btn btn-primary btn-sm">View</Link>
                <button className="btn-ghost btn-sm" onClick={() => remove(i.product_id)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}