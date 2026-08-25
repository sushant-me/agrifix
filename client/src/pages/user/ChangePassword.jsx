import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/auth/change-password', form);
      navigate('/change-password?flash=password_updated');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="form-card">
      <h3>Change Password</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit}>
        <label>Current Password</label>
        <input type="password" value={form.currentPassword} onChange={set('currentPassword')} required />
        <label>New Password</label>
        <input type="password" value={form.newPassword} onChange={set('newPassword')} required minLength={8} />
        <p className="muted small">Min 8 chars with upper, lower, digit and special character.</p>
        <label>Confirm New Password</label>
        <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required minLength={8} />
        <button className="btn btn-primary btn-block mt-3" disabled={busy}>
          {busy ? 'Saving…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}