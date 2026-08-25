import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client.js';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { identifier: identifier.trim() });
      sessionStorage.setItem('ags_reset_token', res.data.data.resetToken);
      if (res.data.data.devOtp) sessionStorage.setItem('ags_dev_otp', res.data.data.devOtp);
      else sessionStorage.removeItem('ags_dev_otp');
      navigate('/verify-otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-card">
      <div className="auth-card-head">
        <div className="auth-logo">🔑</div>
        <h1>Forgot Password</h1>
        <p className="muted small">We will email you a one-time OTP</p>
      </div>
      <p className="muted small text-center mb-3">
        Enter your username or email and we'll send you a verification code.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}
      {devOtp && (
        <div className="alert alert-info">
          Development mode: your OTP is <strong>{devOtp}</strong>
        </div>
      )}
      {maskedEmail && (
        <div className="alert alert-success">
          A verification code has been sent to {maskedEmail}.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label htmlFor="identifier">Username or Email</label>
        <input
          id="identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          autoFocus
        />

        <button type="submit" className="btn btn-primary btn-block mt-3" disabled={submitting}>
          {submitting ? 'Sending code…' : 'Send Verification Code'}
        </button>
      </form>

      <p className="muted small text-center mb-1" style={{ marginTop: 18 }}>
        Remembered your password? <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}