import { useState } from 'react';
import api from '../../api/client.js';
import { PROVINCES, CROPS_BY_DISTRICT } from '../../utils/cropData.js';

const FALLBACK_SEASONS = ['Kharif', 'Rabi', 'Summer', 'Autumn', 'Winter', 'Whole Year'];

export default function CropPrediction() {
  const [form, setForm] = useState({ state: '', district: '', season: 'Kharif' });
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const province = PROVINCES.find((p) => p.name === form.state);
  const seasons = form.district && CROPS_BY_DISTRICT[form.district]
    ? Object.keys(CROPS_BY_DISTRICT[form.district])
    : FALLBACK_SEASONS;

  const setState = (e) => setForm({ state: e.target.value, district: '', season: seasons[0] || 'Kharif' });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult('');
    setBusy(true);
    try {
      const res = await api.post('/ml/crop-prediction', form);
      setResult(res.data.data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-card">
      <h3>Crop Prediction</h3>
      <p className="muted">Find which crops grow in your district during a season.</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit}>
        <label>Province</label>
        <select required value={form.state} onChange={setState}>
          <option value="">Select Province</option>
          {PROVINCES.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        <label>District</label>
        <select required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value, season: (CROPS_BY_DISTRICT[e.target.value] ? Object.keys(CROPS_BY_DISTRICT[e.target.value])[0] : form.season) })}>
          <option value="">Select District</option>
          {(province ? province.districts : []).map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <label>Season</label>
        <select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
          {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-primary btn-block mt-3" disabled={busy}>
          {busy ? 'Predicting…' : 'Predict Crops'}
        </button>
      </form>
      {result && <div className="result-box">{result}</div>}
    </div>
  );
}