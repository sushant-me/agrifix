import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client.js';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('ags_reset_token')) {
      navigate('/forgot-password', { replace: true });
      return;
    }
    const storedDevOtp = sessionStorage.getItem('ags_dev_otp');
    const storedEmail = sessionStorage.getItem('ags_masked_email');
    if (storedDevOtp) {
      setDevOtp(storedDevOtp);
      setOtp(storedDevOtp); // Auto-fill in development for seamless testing
    }
    if (storedEmail) setMaskedEmail(storedEmail);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code.');
      return;
    }
    setSubmitting(true);
    try {
      const resetToken = sessionStorage.getItem('ags_reset_token');
      const res = await api.post('/auth/verify-otp', { resetToken, otp });
      sessionStorage.setItem('ags_reset_token', res.data.data.resetToken);
      navigate('/reset-password');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-card">
      <div className="auth-card-head">
        <div className="auth-logo">✉️</div>
        <h1>Verify OTP</h1>
        <p className="muted small">
          {maskedEmail ? `Code sent to ${maskedEmail}` : 'Enter the code sent to your email'}
        </p>
      </div>

      {devOtp && (
        <div className="alert alert-info" style={{ margin: '12px 0' }}>
          💡 <strong>Development Mode:</strong> Your OTP code is <strong>{devOtp}</strong> (auto-filled).
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="otp">6-digit Code</label>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="e.g. 123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          required
          autoFocus
        />

        <button type="submit" className="btn btn-primary btn-block mt-3" disabled={submitting}>
          {submitting ? 'Verifying…' : 'Verify Code'}
        </button>
      </form>

      <p className="muted small text-center mb-1" style={{ marginTop: 18 }}>
        Didn't receive a code? <Link to="/forgot-password">Request a new code</Link>
      </p>
    </div>
  );
}