import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Sprout, Camera } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!avatar) { setPreview(''); return; }
    const url = URL.createObjectURL(avatar);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  const pickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (file) setAvatar(file);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!avatar) {
      setError('Please upload a profile picture.');
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('username', username.trim());
    fd.append('email', email.trim());
    fd.append('password', password);
    fd.append('confirmPassword', confirmPassword);
    fd.append('avatar', avatar);
    try {
      await api.post('/auth/signup', fd);
      await refresh();
      navigate('/');
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
        <h1>Create Your Account</h1>
        <p className="muted small">Join the AgriSmart farming community</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="avatar">Profile Picture *</label>
        <div className="avatar-picker">
          {preview
            ? <img className="avatar-preview" src={preview} alt="Profile preview" />
            : <div className="avatar-preview placeholder"><Camera size={26} /></div>}
          <div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
              <Camera size={15} /> {avatar ? 'Change photo' : 'Upload photo'}
            </button>
            <p className="muted small" style={{ margin: '8px 0 0' }}>
              A profile picture is required to create your account.
            </p>
          </div>
        </div>
        <input ref={fileRef} type="file" id="avatar" accept="image/jpeg,image/png,image/gif,image/webp" onChange={pickAvatar} style={{ display: 'none' }} />

        <label htmlFor="username">Username</label>
        <input id="username" type="text" value={username} minLength={3} onChange={(e) => setUsername(e.target.value)} required autoFocus />

        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

        <button type="submit" className="btn btn-primary btn-block mt-3" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>

      <p className="muted small text-center mb-1" style={{ marginTop: 18 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}