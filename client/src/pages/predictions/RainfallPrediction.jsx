import { useState } from 'react';
import api from '../../api/client.js';
import { REGIONS, MONTHS } from '../../utils/cropData.js';

export default function RainfallPrediction() {
  const [form, setForm] = useState({ region: REGIONS[0], month: MONTHS[1] });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setData(null);
    setBusy(true);
    try {
      const res = await api.post('/ml/rainfall-prediction', form);
      setData(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-card">
      <h3>Rainfall Prediction</h3>
      <p className="muted">
        View typical monthly precipitation (mm/month) based on Nepal Department of Hydrology & Meteorology (DHM) historical benchmarks.
      </p>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-row">
          <div>
            <label>Agro-ecological Zone</label>
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
          {busy ? 'Fetching meteorological data…' : 'Predict Rainfall'}
        </button>
      </form>

      {data && (
        <div className="result-box" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <span className="badge badge-success" style={{ padding: '4px 10px', fontSize: '0.85rem' }}>
                {data.seasonPhase}
              </span>
              <h4 style={{ margin: '8px 0 2px 0' }}>
                {data.zone} Region · {data.month}
              </h4>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 'bold', color: 'var(--primary-color, #107C41)' }}>
                {data.rainfall} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>mm</span>
              </div>
              <span className="muted small">Monthly Average</span>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div className="small" style={{ marginBottom: 6 }}>
              💧 <strong>Irrigation Need:</strong> {data.irrigationNeed}
            </div>
            <div className="small">
              🌾 <strong>Advisory:</strong> {data.advisory}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
