import { useState } from 'react';
import api from '../../api/client.js';
import { REGIONS, MONTHS } from '../../utils/cropData.js';

export default function RainfallPrediction() {
  const [form, setForm] = useState({ region: REGIONS[0], month: MONTHS[1] });
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult('');
    setBusy(true);
    try {
      const res = await api.post('/ml/rainfall-prediction', form);
      setResult(res.data.data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-card">
      <h3>Rainfall Prediction</h3>
      <p className="muted">View an indicative typical monthly rainfall value (mm/month) for an agro-ecological zone. This is not a weather forecast.</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-row">
          <div>
            <label>Agro-ecological zone</label>
            <select value={form.region} onChange={set('region')}>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label>Month</label>
            <select value={form.month} onChange={set('month')}>
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary btn-block mt-3" disabled={busy}>
          {busy ? 'Predicting…' : 'Predict Rainfall'}
        </button>
      </form>
      {result && <div className="result-box">{result}</div>}
    </div>
  );
}
