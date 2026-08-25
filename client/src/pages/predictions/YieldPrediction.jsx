import { useState } from 'react';
import api from '../../api/client.js';
import { PROVINCES, CROPS_BY_DISTRICT } from '../../utils/cropData.js';

const FALLBACK_SEASONS = ['Kharif', 'Rabi', 'Summer', 'Autumn', 'Winter', 'Whole Year'];

export default function YieldPrediction() {
  const [form, setForm] = useState({ state: '', district: '', season: 'Kharif', crops: '', area: '' });
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const province = PROVINCES.find((p) => p.name === form.state);
  const seasons = form.district && CROPS_BY_DISTRICT[form.district]
    ? Object.keys(CROPS_BY_DISTRICT[form.district])
    : FALLBACK_SEASONS;
  const crops = form.district && CROPS_BY_DISTRICT[form.district] && CROPS_BY_DISTRICT[form.district][form.season]
    ? CROPS_BY_DISTRICT[form.district][form.season]
    : [];

  const setState = (e) => setForm({ ...form, state: e.target.value, district: '', crops: '' });
  const setDistrict = (e) => {
    const d = e.target.value;
    const s = CROPS_BY_DISTRICT[d] ? Object.keys(CROPS_BY_DISTRICT[d])[0] : form.season;
    setForm({ ...form, district: d, season: s, crops: '' });
  };
  const setSeason = (e) => setForm({ ...form, season: e.target.value, crops: '' });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult('');
    setBusy(true);
    try {
      const res = await api.post('/ml/yield-prediction', form);
      setResult(res.data.data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-card">
      <h3>Yield Prediction</h3>
      <p className="muted">Estimate the expected yield (in quintals) for your crop and area.</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-row">
          <div>
            <label>Province</label>
            <select required value={form.state} onChange={setState}>
              <option value="">Select Province</option>
              {PROVINCES.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label>District</label>
            <select required value={form.district} onChange={setDistrict}>
              <option value="">Select District</option>
              {(province ? province.districts : []).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div>
            <label>Season</label>
            <select value={form.season} onChange={setSeason}>
              {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Crop</label>
            <select required value={form.crops} onChange={(e) => setForm({ ...form, crops: e.target.value })}>
              <option value="">Select Crop</option>
              {crops.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <label>Area (hectares)</label>
        <input type="number" step="0.01" min="0" required value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
        <button className="btn btn-primary btn-block mt-3" disabled={busy}>
          {busy ? 'Predicting…' : 'Predict Yield'}
        </button>
      </form>
      {result && <div className="result-box">{result}</div>}
    </div>
  );
}