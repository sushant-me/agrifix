import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircleUser, MessageCircle, Phone, Copy, Check } from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

function stars(rating) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

function timeAgo(ts) {
  if (!ts) return 'offline';
  const secs = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000);
  if (secs < 90) return 'online';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function UserPublic() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setError('');
    api.get(`/users/${id}/public`)
      .then((r) => setData(r.data.data))
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    const tick = () => {
      api.get(`/users/${id}/status`).then((r) => setStatus(r.data.data)).catch(() => {});
    };
    tick();
    const t = setInterval(tick, 20000);
    return () => clearInterval(t);
  }, [id]);

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(data.user.phone_number || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const startChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const r = await api.post('/conversations', { farmerId: Number(id) });
      navigate(`/user-profile?tab=chats&chat=${r.data.data.id}`);
    } catch (err) {
      setMsg(err.message);
    }
  };

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="page-loader">Loading profile…</div>;

  const { user: p, shop, products } = data;
  const isMe = user && Number(user.id) === Number(p.id);
  const online = status ? status.online : (data.status || {}).online;

  return (
    <div>
      <Link to="/marketplace" className="btn btn-ghost btn-sm mb-2">← Back to Marketplace</Link>

      <div className="card user-public-header">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {p.avatar_url ? <img className="profile-avatar" src={p.avatar_url} alt={p.username} /> : <CircleUser className="profile-avatar" size={72} />}
          <div style={{ flex: 1, minWidth: 220 }}>
            <h2 style={{ margin: 0 }}>{p.name || p.username} <span className="badge info">{p.role === 'farmer' ? 'Farmer' : p.role === 'super_admin' ? 'Super Admin' : 'Buyer'}</span></h2>
            <p className="muted small" style={{ margin: 0 }}>@{p.username}</p>
            {shop && (
              <>
                <p className="small" style={{ margin: '4px 0 0' }}><strong>{shop.shop_name}</strong> <span className="stars">{stars(shop.rating)}</span></p>
                {shop.shop_description && <p className="muted small" style={{ margin: 0 }}>{shop.shop_description}</p>}
              </>
            )}
            {shop?.phone_number && (
              <p className="small" style={{ margin: '4px 0 0' }}>
                <Phone size={13} style={{ verticalAlign: 'middle' }} /> <strong>{shop.phone_number}</strong>
                <a className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} href={`tel:${shop.phone_number}`}>Call</a>
                <button type="button" className="btn btn-ghost btn-sm" onClick={copyPhone}>
                  {copied ? <Check size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> : <Copy size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </p>
            )}
            <p className={`small ${online ? 'text-success' : 'muted'}`} style={{ margin: '6px 0 0' }}>
              <span className={`online-dot ${online ? 'on' : ''}`} /> {status ? (status.online ? 'Online now' : `Last seen ${timeAgo(status.lastSeenAt)}`) : 'Connecting…'}
            </p>
          </div>

          {!isMe && (
            <div>
              <button type="button" className="btn btn-primary" onClick={startChat}>
                <MessageCircle size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {user ? 'Chat' : 'Login to Chat'}
              </button>
              {msg && <p className="alert alert-danger small mt-1">{msg}</p>}
            </div>
          )}
        </div>

        {!user && (
          <p className="muted small mt-2">
            <Link to="/login">Login</Link> to message this {p.role === 'farmer' ? 'farmer' : 'user'} directly.
          </p>
        )}
        <Link to="/user-profile" className="btn btn-ghost btn-sm mt-2">← My Profile</Link>
      </div>

      <div className="card mt-3">
        <h3>{p.role === 'farmer' ? 'Products by this Farmer' : 'Products'}</h3>
        {!products.length && <p className="muted">No products listed right now.</p>}
        <div className="grid-products">
          {products.map((prod) => (
            <Link key={prod.id} to={`/product/${prod.id}`} className="product-card card">
              {prod.image ? (
                <img src={prod.image} alt={prod.name} loading="lazy" />
              ) : (
                <div className="thumb-fallback">🌾</div>
              )}
              <div className="product-body">
                <strong>{prod.name}</strong>
                <p className="product-price">Rs {Number(prod.price).toLocaleString()}{prod.unit ? <span className="muted small"> / {prod.unit}</span> : null}</p>
                {prod.location ? <p className="muted small">📍 {prod.location}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}