import { useEffect, useState } from 'react';
import api from '../api/client.js';

const CITIES = [
  'Kathmandu', 'Pokhara', 'Chitwan', 'Janakpur', 'Birgunj',
  'Butwal', 'Bhairahawa', 'Nepalgunj', 'Biratnagar',
];

export default function Weather() {
  const [city, setCity] = useState('Kathmandu');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentError, setRecentError] = useState('');

  useEffect(() => {
    api.get('/weather/recent')
      .then((res) => setRecent(res.data.data))
      .catch((err) => setRecentError(err.message));
  }, []);

  const handleFetch = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResult(null);
    if (!city.trim()) {
      setError('Enter a city name.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/weather/fetch?city=${encodeURIComponent(city.trim())}`);
      setMessage(res.data.message);
      setResult(res.data.data);
      const r = await api.get('/weather/recent');
      setRecent(r.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Weather</h1>
        <p className="muted">Live conditions for cities across Nepal — fetched from OpenWeather.</p>
      </div>
      <div className="card">
        <h3>Current Weather</h3>
        <form onSubmit={handleFetch} className="form-row">
          <div>
            <label htmlFor="city">City</label>
            <input id="city" type="text" list="cities" value={city} onChange={(e) => setCity(e.target.value)} required />
            <datalist id="cities">
              {CITIES.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 27 }} disabled={loading}>
            {loading ? 'Fetching…' : 'Fetch Weather'}
          </button>
        </form>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {result && (
          <div className="result-box" style={{ whiteSpace: 'normal' }}>
            <h4 style={{ marginBottom: 8 }}>☁️ {result.city}{result.country ? `, ${result.country}` : ''}</h4>
            <p style={{ margin: '4px 0' }}><strong>Temperature:</strong> {result.temperature ?? '—'} °C</p>
            <p style={{ margin: '4px 0' }}><strong>Humidity:</strong> {result.humidity ?? '—'}%</p>
            <p style={{ margin: '4px 0' }}><strong>Wind Speed:</strong> {result.windSpeed ?? '—'} m/s</p>
            <p style={{ margin: '4px 0' }}><strong>Conditions:</strong> {result.description || '—'}</p>
          </div>
        )}
      </div>

      <h2 className="mb-2">Recent Weather Records</h2>
      {recentError && <div className="alert alert-danger">{recentError}</div>}
      {recent.length === 0 && !recentError ? <p className="muted">No weather records yet.</p> : null}
      {recent.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>City</th>
                <th>Country</th>
                <th>Temp (°C)</th>
                <th>Humidity (%)</th>
                <th>Wind (m/s)</th>
                <th>Conditions</th>
                <th>Recorded At</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id}>
                  <td>{r.city}</td>
                  <td>{r.country || '—'}</td>
                  <td>{r.temperature ?? '—'}</td>
                  <td>{r.humidity ?? '—'}</td>
                  <td>{r.wind_speed ?? '—'}</td>
                  <td>{r.weather_description || '—'}</td>
                  <td>{new Date(r.recorded_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}