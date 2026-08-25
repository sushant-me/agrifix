import { useRef, useState } from 'react';
import api from '../../api/client.js';

export default function PlantDiseasePrediction() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [plant, setPlant] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, GIF or WEBP).');
      return;
    }
    setError('');
    setResult(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const pasteImage = (e) => {
    const item = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith('image/'));
    const f = item?.getAsFile();
    if (!f) { setError('Clipboard has no image — copy a photo first (⌘C / Ctrl+C), then paste here.'); return; }
    e.preventDefault();
    setError('');
    setResult(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Upload a photo of the plant leaf first.');
      return;
    }
    setError('');
    setResult(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      if (plant.trim()) fd.append('plant', plant.trim());
      const res = await api.post('/ml/plant-disease', fd);
      setResult(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-card">
      <h3>Plant Disease Prediction</h3>
      <p className="muted">
        Upload a photo of the plant leaf and get the disease, how to save the plant,
        a 7-day action plan and growing tips.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}
      {result?.offline && (
        <div className="alert alert-warning">
          The AI image model is unavailable, so this is a general protective guide. Retry later for a leaf-specific analysis.
        </div>
      )}
      {result?.lowConfidence && (
        <div className="alert alert-warning">
          The image match is low confidence. Treat this as a possible match and confirm it with a local agricultural expert before applying pesticides.
        </div>
      )}

      <form onSubmit={submit}>
        <div
          className="leaf-drop"
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current && inputRef.current.click()}
          onPaste={pasteImage}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current && inputRef.current.click(); } }}
        >
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
          {preview ? (
            <img className="leaf-preview" src={preview} alt="Selected leaf" />
          ) : (
            <div className="leaf-placeholder">
              📷 Click to upload a leaf photo
              <span className="muted">JPG, PNG, GIF or WEBP — up to 8 MB</span>
              <span className="muted">…or copy a photo and paste here (⌘V / Ctrl+V)</span>
            </div>
          )}
        </div>

        <div className="form-row" style={{ marginTop: 14 }}>
          <div>
            <label>Plant name (optional)</label>
            <input
              type="text"
              placeholder="e.g. Tomato, Paddy, Potato, Maize"
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn-primary btn-block mt-3" disabled={busy}>
          {busy ? 'Analysing leaf…' : 'Predict Disease'}
        </button>
      </form>

      {result && (
        <div className="pred-result">
          <div className="pred-head">
            <div>
              <span className="pred-label">Detected disease</span>
              <h4>{result.disease || 'Unidentified'}</h4>
            </div>
            <div className="pred-badges">
              <span className={`pred-badge ${result.severity || 'unknown'}`}>
                Severity: {result.severity || 'unknown'}
              </span>
              <span className="pred-badge">Confidence: {result.confidence || 'medium'}</span>
            </div>
          </div>

          {(result.plant && result.plant !== 'Unidentified plant') && (
            <p className="muted" style={{ marginTop: 6 }}>Plant: <strong>{result.plant}</strong></p>
          )}

          {result.symptoms && (
            <div className="pred-block">
              <h5>Visible symptoms</h5>
              <p>{result.symptoms}</p>
            </div>
          )}

          {result.whatWillHappen && (
            <div className="pred-block">
              <h5>What will happen if left untreated</h5>
              <p>{result.whatWillHappen}</p>
            </div>
          )}

          {result.treatment?.length > 0 && (
            <div className="pred-block">
              <h5>How to save this plant</h5>
              <ol className="pred-list">
                {result.treatment.map((t, i) => <li key={i}>{t}</li>)}
              </ol>
            </div>
          )}

          {result.actionPlan?.length > 0 && (
            <div className="pred-block">
              <h5>7-day action plan</h5>
              <div className="pred-plan">
                {result.actionPlan.map((s, i) => (
                  <div className="pred-plan-day" key={i}>
                    <strong>{s.day}</strong>
                    <p>{s.tasks}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.growingGuide?.length > 0 && (
            <div className="pred-block">
              <h5>How to grow this plant</h5>
              <ul className="pred-list">
                {result.growingGuide.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}