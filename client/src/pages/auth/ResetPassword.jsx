import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('ags_reset_token')) {
      navigate('/forgot-password', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const resetToken = sessionStorage.getItem('ags_reset_token');
      await api.post('/auth/reset-password', { resetToken, newPassword, confirmPassword });
      sessionStorage.removeItem('ags_reset_token');
      sessionStorage.removeItem('ags_masked_email');
      navigate('/login?flash=password_updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-card">
      <div className="auth-card-head">
        <div className="auth-logo">🔒</div>
        <h1>Reset Password</h1>
        <p className="muted small">Choose a new password for your account</p>
      </div>
      <p className="muted small text-center mb-3">Choose a new password for your account.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="newPassword">New Password</label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          autoFocus
        />

        <label htmlFor="confirmPassword">Confirm New Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button type="submit" className="btn btn-primary btn-block mt-3" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}