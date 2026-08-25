import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Sprout, CircleUser } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin, isSuperAdmin, role } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    api.post('/chat/heartbeat').catch(() => {});
    const t = setInterval(() => api.post('/chat/heartbeat').catch(() => {}), 40000);
    return () => clearInterval(t);
  }, [user]);

  if (user?.role === 'super_admin') return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const link = (to, label, cls = '') => (
    <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${cls}`} onClick={() => setOpen(false)}>
      {label}
    </NavLink>
  );

  const dropdown = (btn, items) => (
    <div className="nav-dropdown">
      <button className="nav-link nav-dropdown-btn">{btn} ▾</button>
      <div className="nav-dropdown-menu right">
        {items}
      </div>
    </div>
  );

  return (
    <nav className="site-nav">
      <div className="nav-inner container">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-icon"><Sprout size={18} /></span> AgriSmart
        </Link>

        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
          ☰
        </button>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          {link('/', 'Home')}
          {link('/marketplace', 'Marketplace')}

          {dropdown('Tools', (
            <>
              <Link to="/predictions/crop-recommendation" onClick={() => setOpen(false)}>Crop Recommendation</Link>
              <Link to="/predictions/crop-prediction" onClick={() => setOpen(false)}>Crop Prediction</Link>
              <Link to="/predictions/yield-prediction" onClick={() => setOpen(false)}>Yield Prediction</Link>
              <Link to="/predictions/fertilizer-recommendation" onClick={() => setOpen(false)}>Fertilizer Recommendation</Link>
              <Link to="/predictions/rainfall-prediction" onClick={() => setOpen(false)}>Rainfall Prediction</Link>
              <Link to="/predictions/plant-disease" onClick={() => setOpen(false)}>Plant Disease Prediction</Link>
              <Link to="/weather" onClick={() => setOpen(false)}>Weather Forecast</Link>
            </>
          ))}

          {user ? (
            <>
              {/* FARMER (panel access) */}
              {isAdmin && link('/farmer', 'Farmer Panel', 'nav-admin-pill')}

              <div className="nav-dropdown">
                <Link to="/user-profile" className="nav-link nav-dropdown-btn nav-user" onClick={() => setOpen(false)}>
                  {user.avatar_url
                    ? <img className="nav-avatar" src={user.avatar_url} alt={user.username} />
                    : <CircleUser size={16} />}
                  {user.username}
                  {isSuperAdmin && <span className="nav-role-badge">SA</span>}
                  {isAdmin && !isSuperAdmin && <span className="nav-role-badge">FM</span>}
                </Link>
                <button type="button" className="nav-caret" onClick={() => setOpen((v) => !v)} aria-label="Account menu">▾</button>
                <div className="nav-dropdown-menu right">
                  <Link to="/user-profile" onClick={() => setOpen(false)}>My Profile</Link>
                  <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                  <Link to="/my-orders" onClick={() => setOpen(false)}>My Orders</Link>
                  <Link to="/cart" onClick={() => setOpen(false)}>My Cart</Link>
                  {user?.role === 'farmer' && (
                    <Link to="/add-product" onClick={() => setOpen(false)}>Sell a Product</Link>
                  )}
                  <Link to="/wishlist" onClick={() => setOpen(false)}>Wishlist</Link>
                  <Link to="/change-password" onClick={() => setOpen(false)}>Change Password</Link>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              </div>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}