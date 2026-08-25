import { useState } from 'react';
import api from '../../api/client.js';
import { PROVINCES } from '../../utils/cropData.js';

const ALL_DISTRICTS = PROVINCES.flatMap((p) => p.districts);

const SEASONS = [
  'Any', 'Spring (Baisakh–Jestha)', 'Monsoon (Asar–Bhadra)', 'Autumn (Asoj–Mangsir)', 'Winter (Poush–Falgun)',
];

const CONTEXT_LABELS = [
  ['temperature', 'Temperature'],
  ['humidity', 'Humidity'],
  ['rainfall', 'Rainfall'],
  ['ph', 'Soil pH'],
  ['n', 'Nitrogen (N)'],
  ['p', 'Phosphorus (P)'],
  ['k', 'Potassium (K)'],
];

const SOURCE_LABEL = {
  'live-weather': 'Live weather + auto soil',
  'cached-weather': 'Cached weather + auto soil',
  'region-defaults': 'Regional defaults (weather API unavailable)',
};

export default function CropRecommendation() {
  const [form, setForm] = useState({ location: '', season: SEASONS[0] });
  const [result, setResult] = useState('');
  const [crops, setCrops] = useState([]);
  const [context, setContext] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);


  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult('');
    setCrops([]);
    setContext(null);
    setBusy(true);
    // try {
    //   const res = await api.post('/ml/crop-recommendation', form);
    //   setResult(res.data.data.message);
    //   setCrops(res.data.data.crops || []);
    //   setContext(res.data.data.context || null);
    // } catch (err) {
    //   setError(err.message);
    // } finally {
    //   setBusy(false);
    // }
    try {
  const res = await api.post('/ml/crop-recommendation', form);

  setResult(res.data.data.message);

  const uniqueCrops = [...new Set(res.data.data.crops || [])];
  setCrops(uniqueCrops);

  setContext(res.data.data.context || null);
}catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-card">
      <h3>Crop Recommendation</h3>
      <p className="muted">Enter your location and season — soil and climate parameters are fetched automatically.</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-row">
          <div>
            <label>Location (city or district)</label>
            <input
              type="text"
              list="crop-locations"
              placeholder="e.g. Jhapa, Chitwan, Pokhara…"
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label>Season</label>
            <select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
              {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <datalist id="crop-locations">
          {ALL_DISTRICTS.map((d) => <option key={d} value={d} />)}
        </datalist>
        <button className="btn btn-primary btn-block mt-3" disabled={busy}>
          {busy ? 'Fetching data & predicting…' : 'Recommend Crop'}
        </button>
      </form>

      {context && (
        <div className="result-box" style={{ marginTop: 16 }}>
          <div className="muted small" style={{ marginBottom: 8 }}>
            Auto-fetched for <strong>{context.location}</strong> · Season: {context.season || 'Any'} · {SOURCE_LABEL[context.source] || context.source} · Soil: {context.soil}
          </div>
          <div className="fertilizer-context-grid">
            {CONTEXT_LABELS.map(([key, label]) => (
              <div key={key}>
                <span className="muted small">{label}</span>
                <strong>
                  {context[key]}
                  {key === 'temperature' ? '°C' : key === 'humidity' ? '%' : key === 'rainfall' ? ` mm (${context.rainfallUnit ? (context.rainfallUnit.includes('annual') ? 'annual' : 'seasonal') : 'seasonal'})` : ''}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {crops.length > 0 && (
        <div className="result-box">
          <div className="muted small" style={{ marginBottom: 8 }}>Best {crops.length} crops for <strong>{context?.location}</strong> in {context?.season || 'Any'}:</div>
          <div className="crop-chips">
            {/* {crops.map((c, i) => <span key={c} className="crop-chip">{i + 1}. {c}</span>)} */}
            {[...new Set(crops)].map((c, i) => (
              <span key={c} className="crop-chip">
                {i + 1}. {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {result && <div className="result-box">{result}</div>}
    </div>
  );
}