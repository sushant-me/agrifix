import { useState } from 'react';
import api from '../../api/client.js';
import { PROVINCES } from '../../utils/cropData.js';

const CROPS = [
  'Rice', 'Sugarcane', 'Barley', 'Wheat', 'Millet', 'Ginger', 'Lentil', 'Groundnut',
  'Sesame', 'Mustard', 'Chickpea', 'Pea', 'Potato', 'Tomato', 'Banana', 'Mung Bean',
  'Pumpkin', 'Cabbage', 'Cauliflower', 'Tea', 'Turmeric', 'Buckwheat', 'Cardamom',
  'Cucumber', 'Soybean', 'Vegetables',
];

const ALL_DISTRICTS = PROVINCES.flatMap((p) => p.districts);

const CONTEXT_LABELS = [
  ['temperature', 'Temperature'],
  ['humidity', 'Humidity'],
  ['soilMoisture', 'Soil Moisture'],
  ['n', 'Nitrogen (N)'],
  ['p', 'Phosphorus (P)'],
  ['k', 'Potassium (K)'],
];

const SOURCE_LABEL = {
  'live-weather': 'Live weather + auto soil',
  'cached-weather': 'Cached weather + auto soil',
  'region-defaults': 'Regional defaults (weather API unavailable)',
};

export default function FertilizerRecommendation() {
  const [form, setForm] = useState({ location: '', crop: CROPS[0] });
  const [result, setResult] = useState('');
  const [context, setContext] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult('');
    setContext(null);
    setBusy(true);
    try {
      const res = await api.post('/ml/fertilizer-recommendation', form);
      setResult(res.data.data.message);
      setContext(res.data.data.context || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-card">
      <h3>Fertilizer Recommendation</h3>
      <p className="muted">Enter only your location and crop — temperature, humidity and soil data are fetched automatically.</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit}>
        <label>Location (city or district)</label>
        <input
          type="text"
          list="fertilizer-locations"
          placeholder="e.g. Jhapa, Chitwan, Pokhara…"
          required
          value={form.location}
          onChange={set('location')}
        />
        <datalist id="fertilizer-locations">
          {ALL_DISTRICTS.map((d) => <option key={d} value={d} />)}
        </datalist>
        <label>Crop</label>
        <select value={form.crop} onChange={set('crop')}>
          {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-primary btn-block mt-3" disabled={busy}>
          {busy ? 'Fetching data & predicting…' : 'Recommend Fertilizer'}
        </button>
      </form>

      {context && (
        <div className="result-box" style={{ marginTop: 16 }}>
          <div className="muted small" style={{ marginBottom: 8 }}>
            Auto-fetched for <strong>{context.location}</strong> · {SOURCE_LABEL[context.source] || context.source} · Soil: {context.soil}
          </div>
          <div className="fertilizer-context-grid">
            {CONTEXT_LABELS.map(([key, label]) => (
              <div key={key}>
                <span className="muted small">{label}</span>
                <strong>{context[key]}{key === 'temperature' ? '°C' : key === 'humidity' || key === 'soilMoisture' ? '%' : ' mg/kg'}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && <div className="result-box">{result}</div>}
    </div>
  );
}