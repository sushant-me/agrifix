import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Sprout, Leaf, FlaskConical, TrendingUp, CloudRain, ShoppingBasket,
  Store, Package, Camera, CircleUser,
} from 'lucide-react';

const FEATURES = [
  { to: '/predictions/crop-recommendation', Icon: Sprout, title: 'Crop Recommendation', text: 'Get the best crop for your soil conditions (N, P, K, pH, temperature, humidity, rainfall).' },
  { to: '/predictions/crop-prediction', Icon: Leaf, title: 'Crop Prediction', text: 'Discover which crops grow well in your state and district during a given season.' },
  { to: '/predictions/fertilizer-recommendation', Icon: FlaskConical, title: 'Fertilizer Recommendation', text: 'Find the right fertilizer for your soil and crop with ML-powered advice.' },
  { to: '/predictions/yield-prediction', Icon: TrendingUp, title: 'Yield Prediction', text: 'Estimate expected yield in quintals for your crop, region and area.' },
  { to: '/predictions/rainfall-prediction', Icon: CloudRain, title: 'Rainfall Prediction', text: 'Plan sowing around predicted rainfall for your region and month.' },
  { to: '/marketplace', Icon: ShoppingBasket, title: 'Farm Marketplace', text: 'Buy and sell produce, seeds, fertilizers and equipment directly.' },
];

export default function Dashboard() {
  const { user, refresh } = useAuth();
  const fileRef = useRef(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const changeAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarBusy(true);
    setAvatarError('');
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      await api.post('/users/avatar', fd);
      await refresh();
    } catch (err) {
      setAvatarError(err.message);
    } finally {
      setAvatarBusy(false);
    }
  };

  return (
    <div>
      <div className="hero">
        <span className="hero-badge">Dashboard</span>
        <h1>Welcome back, {user?.username}!</h1>
        <p>Your smart farming toolkit is ready. Explore predictions, recommendations and the marketplace.</p>
        <div className="actions-inline" style={{ justifyContent: 'center' }}>
          <Link to="/marketplace" className="btn btn-primary">Go to Marketplace</Link>
          <Link to="/predictions/crop-recommendation" className="btn btn-ghost">Try Crop Recommendation</Link>
        </div>
      </div>

      <div className="card profile-card">
        <div className="profile-avatar">
          {user?.avatar_url
            ? <img src={user.avatar_url} alt={user.username} />
            : <CircleUser size={44} />}
        </div>
        <div className="profile-info">
          <h3 style={{ marginBottom: 2 }}>{user?.username}</h3>
          <p className="muted small" style={{ margin: 0 }}>
            Role: <span className="badge info">{user?.role}</span>
          </p>
        </div>
        <div className="profile-actions">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={changeAvatar} style={{ display: 'none' }} />
          <button className="btn btn-ghost btn-sm" disabled={avatarBusy} onClick={() => fileRef.current?.click()}>
            <Camera size={15} /> {avatarBusy ? 'Uploading…' : 'Change profile picture'}
          </button>
          {avatarError && <p className="small" style={{ color: 'var(--danger)', margin: '6px 0 0' }}>{avatarError}</p>}
        </div>
      </div>

      <div className="feature-grid">
        {FEATURES.map(({ to, Icon, title, text }) => (
          <Link key={to} to={to} className="feature-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="icon"><Icon size={22} /></div>
            <h4 className="mb-1">{title}</h4>
            <p className="muted small" style={{ margin: 0 }}>{text}</p>
          </Link>
        ))}
        {user?.role === 'farmer' && (
          <Link to="/add-product" className="feature-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="icon"><Store size={22} /></div>
            <h4 className="mb-1">Sell a Product</h4>
            <p className="muted small" style={{ margin: 0 }}>List your produce on the AgriSmart marketplace.</p>
          </Link>
        )}
        <Link to="/my-orders" className="feature-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="icon"><Package size={22} /></div>
          <h4 className="mb-1">My Orders</h4>
          <p className="muted small" style={{ margin: 0 }}>Track orders and payments.</p>
        </Link>
      </div>
    </div>
  );
}