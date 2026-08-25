import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircleUser, Phone, MessageCircle, Minus, Plus, ShoppingCart, Zap } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function stars(rating) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [quantity, setQuantity] = useState(1);
  const [cartMsg, setCartMsg] = useState('');
  const [cartError, setCartError] = useState('');
  const [wishMsg, setWishMsg] = useState('');
  const [wishError, setWishError] = useState('');

  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [seller, setSeller] = useState(null);
  useEffect(() => setActiveImage(0), [id]);

  const load = () => {
    setLoading(true);
    setError('');
    api.get(`/products/${id}`)
      .then((res) => {
        setData(res.data.data);
        const sellerId = res.data.data.product?.seller_id;
        if (sellerId) {
          api.get(`/users/${sellerId}/summary`)
            .then((r) => setSeller(r.data.data))
            .catch(() => setSeller(null));
        } else {
          setSeller(null);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    setCartMsg('');
    setCartError('');
    try {
      await api.post('/cart/items', { productId: Number(id), quantity });
      setCartMsg('Added to cart');
    } catch (err) {
      setCartError(err.message);
    }
  };

  const handleBuyNow = async (e) => {
    e.preventDefault();
    setCartMsg('');
    setCartError('');
    try {
      await api.post('/cart/items', { productId: Number(id), quantity });
      navigate('/checkout');
    } catch (err) {
      setCartError(err.message);
    }
  };

  const changeQty = (delta) => {
    setQuantity((q) => Math.max(1, Math.min(Number(product.quantity_available) || 1, q + delta)));
  };

  const handleWishlist = async () => {
    setWishMsg('');
    setWishError('');
    try {
      await api.post('/wishlist', { productId: Number(id) });
      setWishMsg('Added to wishlist');
    } catch (err) {
      setWishError(err.message);
    }
  };

  const startEdit = () => {
    setEditing(true);
    setRating(data.myReview.rating);
    setReviewText(data.myReview.review_text || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReview = async (e) => {
    e.preventDefault();
    setReviewMsg('');
    setReviewError('');
    try {
      await api.post(`/products/${id}/reviews`, { rating, reviewText });
      setReviewText('');
      setEditing(false);
      setReviewMsg('Review saved.');
      load();
    } catch (err) {
      setReviewError(err.message);
    }
  };

  const handleDeleteReview = async () => {
    setReviewMsg('');
    setReviewError('');
    try {
      await api.delete(`/products/${id}/reviews`);
      setEditing(false);
      setReviewMsg('Review deleted.');
      load();
    } catch (err) {
      setReviewError(err.message);
    }
  };

  if (loading) return <p className="muted text-center">Loading product…</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="alert alert-info">Product not found.</div>;

  const { product, avgRating, totalReviews, reviews, myReview, gallery } = data;
  const images = (gallery && gallery.length ? gallery : []).map((g) => g.url);
  const showImage = images.length ? images[Math.min(activeImage, images.length - 1)] : product.image_url;

  return (
    <>
      <Link to="/marketplace" className="btn btn-ghost btn-sm mb-2">← Back to Marketplace</Link>

      <div className="grid-2">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {showImage ? (
            <img
              key={showImage}
              src={showImage}
              alt={product.product_name}
              style={{ width: '100%', display: 'block', minHeight: 260 }}
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.classList.add('thumb-fallback'); }}
            />
          ) : (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, background: 'var(--paper-2)' }}>
              🥕
            </div>
          )}
          {images.length > 1 && (
            <div className="gallery-strip">
              {images.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  className={`gallery-thumb ${i === activeImage ? 'active' : ''}`}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Photo ${i + 1}`}
                >
                  <img src={url} alt={`${product.product_name} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="right-col">
          <div className="card product-info-card">
            <div className="product-head">
              <div>
                <h2 style={{ margin: 0 }}>{product.product_name}</h2>
                <div className="badge-row">
                  <span className="badge info">{product.category}</span>
                  {product.is_organic ? <span className="badge success">Organic</span> : null}
                </div>
              </div>
              <div className="product-rating">
                <span className="stars">{stars(avgRating)}</span>
                <span className="muted small">{totalReviews} review{totalReviews === 1 ? '' : 's'}</span>
              </div>
            </div>

            <div className="product-price-block">
              <span className="product-price">₹{Number(product.price).toLocaleString()}{product.unit ? <span className="muted small"> / {product.unit}</span> : null}</span>
            </div>

            <div className="product-details">
              <div className="detail-row"><span>Quantity available</span><strong>{product.quantity_available} {product.unit}</strong></div>
              {product.location ? <div className="detail-row"><span>Location</span><strong>{product.location}</strong></div> : null}
            </div>

            <p className="product-desc">{product.description || 'No description provided.'}</p>

            <div className="product-actions">
              {cartMsg && <div className="alert alert-success">{cartMsg} — <Link to="/cart">View cart</Link></div>}
              {cartError && <div className="alert alert-danger">{cartError}</div>}

              {user ? (
                <form onSubmit={handleAddToCart}>
                  <div className="buy-row">
                    <div className="qty-box">
                      <label htmlFor="qty">Quantity</label>
                      <div className="qty-stepper">
                        <button type="button" className="qty-btn" onClick={() => changeQty(-1)} aria-label="Less"><Minus size={14} /></button>
                        <input
                          id="qty"
                          type="number"
                          min={1}
                          max={product.quantity_available}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Math.min(Number(product.quantity_available), Number(e.target.value) || 1)))}
                        />
                        <button type="button" className="qty-btn" onClick={() => changeQty(1)} aria-label="More"><Plus size={14} /></button>
                      </div>
                    </div>
                    <div className="buy-btns">
                      <button type="submit" className="btn btn-primary buy-cart">
                        <ShoppingCart size={15} /> Add to Cart
                      </button>
                      <button type="button" className="btn buy-now" onClick={handleBuyNow}>
                        <Zap size={15} /> Buy Now
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <Link to="/login" className="btn btn-primary">Login to Buy</Link>
              )}

              {user && (
                <div className="wish-row">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleWishlist}>♥ Wishlist</button>
                  {wishMsg && <div className="alert alert-success">{wishMsg}</div>}
                  {wishError && <div className="alert alert-danger">{wishError}</div>}
                </div>
              )}
            </div>
          </div>

          {seller && (
            <div className="card seller-card">
              <Link to={`/users/${seller.id}`} className="seller-card-link">
                {seller.avatar_url
                  ? <img className="profile-avatar" src={seller.avatar_url} alt={seller.username} />
                  : <CircleUser className="profile-avatar" size={48} />}
                <div>
                  <strong>{seller.name || seller.username}</strong>
                  {seller.shop_name && <span className="muted small"> · {seller.shop_name}</span>}
                  <p className={`small ${seller.status?.online ? 'text-success' : 'muted'}`} style={{ margin: 0 }}>
                    <span className={`online-dot ${seller.status?.online ? 'on' : ''}`} />
                    {seller.status?.online ? 'Online now' : 'Offline'}
                    {seller.phone_number ? ` · 📞 ${seller.phone_number}` : ''}
                  </p>
                </div>
              </Link>
              <div className="seller-actions">
                {seller.phone_number && <a className="btn btn-ghost btn-sm" href={`tel:${seller.phone_number}`}><Phone size={13} /> Call Farmer</a>}
                <Link className="btn btn-primary btn-sm" to={`/users/${seller.id}`}><MessageCircle size={13} /> View &amp; Message</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid-2 mt-3">
        <div className="card">
          <h3>Reviews ({totalReviews})</h3>
          {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
          {reviews.map((r) => (
            <div key={r.id} style={{ borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
              <div className="stars">{stars(r.rating)}</div>
              <p className="small" style={{ margin: '2px 0' }}>
                <strong>{r.reviewer_name}</strong> · {new Date(r.created_at).toLocaleDateString()}
                {r.is_verified_purchaser ? <span className="badge success" style={{ marginLeft: 8 }}>Verified purchase</span> : null}
              </p>
              <p className="small" style={{ margin: 0 }}>{r.review_text}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>{myReview ? 'Your Review' : 'Write a Review'}</h3>

          {!user && (
            <p className="muted">
              <Link to="/login">Login</Link> to write a review.
            </p>
          )}

          {user && myReview && !editing && (
            <>
              <div className="stars" style={{ fontSize: '1.1rem' }}>{stars(myReview.rating)}</div>
              <p className="small">{myReview.review_text}</p>
              <div className="actions-inline">
                <button type="button" className="btn btn-ghost btn-sm" onClick={startEdit}>Edit</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteReview}>Delete</button>
              </div>
            </>
          )}

          {user && (!myReview || editing) && (
            <form onSubmit={handleReview}>
              <label htmlFor="rating">Rating</label>
              <select id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{'★'.repeat(r)}{'☆'.repeat(5 - r)}</option>)}
              </select>

              <label htmlFor="reviewText">Review</label>
              <textarea id="reviewText" value={reviewText} onChange={(e) => setReviewText(e.target.value)} required />

              {reviewMsg && <div className="alert alert-success">{reviewMsg}</div>}
              {reviewError && <div className="alert alert-danger">{reviewError}</div>}

              <button type="submit" className="btn btn-primary">{editing ? 'Update Review' : 'Submit Review'}</button>
              {editing && (
                <button type="button" className="btn btn-ghost" style={{ marginLeft: 8 }} onClick={() => { setEditing(false); setReviewText(''); }}>
                  Cancel
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </>
  );
}