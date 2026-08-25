import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Sprout } from 'lucide-react';

export default function Login() {
  const { user, loading, login, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(() => {
    const t = new URLSearchParams(location.search).get('tab');
    return t === 'super_admin' ? 'super_admin' : t === 'farmer' || t === 'admin' ? 'admin' : 'user';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === 'super_admin' ? '/super-admin' : isAdmin ? '/farmer' : '/dashboard', { replace: true });
    }
  }, [user, loading, isAdmin, navigate]);

  const switchTab = (next) => {
    setTab(next);
    setError('');
    navigate({ search: next === 'user' ? '' : `tab=${next === 'admin' ? 'farmer' : next}` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(username, password, tab);
      if (data.redirect) return navigate(data.redirect);
      if (data.role === 'super_admin') return navigate('/super-admin');
      navigate(tab === 'user' ? '/dashboard' : '/farmer');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-card">
      <div className="auth-card-head">
        <div className="auth-logo"><Sprout size={26} /></div>
        <h1>Welcome back</h1>
        <p className="muted small">Sign in to your AgriSmart account</p>
      </div>

      <div className="auth-tabs">
        <button type="button" className={`auth-tab ${tab === 'user' ? 'active' : ''}`} onClick={() => switchTab('user')}>
          User Login
        </button>
        <button type="button" className={`auth-tab ${tab === 'admin' ? 'active' : ''}`} onClick={() => switchTab('admin')}>
          Farmer Login
        </button>
        <button type="button" className={`auth-tab ${tab === 'super_admin' ? 'active' : ''}`} onClick={() => switchTab('super_admin')}>
          Super Admin
        </button>
      </div>
      {tab === 'admin' && (
        <p className="muted small text-center" style={{ margin: '-10px 0 4px' }}>
          For farmer accounts with panel access
        </p>
      )}
      {tab === 'super_admin' && (
        <p className="muted small text-center" style={{ margin: '-10px 0 4px' }}>
          For the super administrator
        </p>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username</label>
        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button type="submit" className="btn btn-primary btn-block mt-3" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <p className="muted small text-center mb-1" style={{ marginTop: 18 }}>
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
      <p className="muted small text-center mb-1">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </div>
  );
}