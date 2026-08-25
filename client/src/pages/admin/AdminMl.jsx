import { useEffect, useState } from 'react';
import api from '../../api/client.js';

const ALGORITHMS = ['random_forest', 'decision_tree', 'svm', 'logistic_regression', 'knn', 'naive_bayes'];

export default function AdminMl() {
  const [datasets, setDatasets] = useState([]);
  const [models, setModels] = useState([]);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [trainForm, setTrainForm] = useState({ datasetId: '', modelName: '', targetColumn: '', algorithm: 'random_forest' });
  const [training, setTraining] = useState(false);
  const [trainOutput, setTrainOutput] = useState('');

  const loadAll = () => {
    api.get('/admin/ml/datasets').then((r) => setDatasets(r.data.data)).catch((e) => setError(e.message));
    api.get('/admin/ml/models').then((r) => setModels(r.data.data)).catch((e) => setError(e.message));
  };

  useEffect(() => { loadAll(); }, []);

  const upload = async (e) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.target);
    try {
      await api.post('/admin/ml/datasets', fd);
      setNotice('Dataset uploaded.');
      loadAll();
      e.target.reset();
    } catch (err) {
      setError(err.message);
    }
  };

  const previewDataset = async (id) => {
    try {
      const res = await api.get(`/admin/ml/datasets/${id}/preview`);
      setPreview(res.data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeDataset = async (d) => {
    if (!window.confirm(`Delete dataset "${d.dataset_name}"?`)) return;
    await api.delete(`/admin/ml/datasets/${d.id}`);
    loadAll();
  };

  const train = async (e) => {
    e.preventDefault();
    setError('');
    setTraining(true);
    setTrainOutput('Training model… this may take a while.');
    try {
      const res = await api.post('/admin/ml/models/train', trainForm);
      setTrainOutput(JSON.stringify(res.data.data, null, 2));
      setNotice('Model trained.');
      loadAll();
    } catch (err) {
      setError(err.message);
      setTrainOutput('');
    } finally {
      setTraining(false);
    }
  };

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="grid-2">
        <div className="card">
          <h3>Upload Dataset</h3>
          <form onSubmit={upload}>
            <label>Dataset Name (optional)</label>
            <input type="text" name="datasetName" />
            <label>CSV / XLS / XLSX file *</label>
            <input type="file" name="datasetFile" accept=".csv,.xls,.xlsx" required />
            <button className="btn btn-primary btn-block mt-3">Upload</button>
          </form>
        </div>

        <div className="card">
          <h3>Train Model</h3>
          <form onSubmit={train}>
            <label>Dataset</label>
            <select value={trainForm.datasetId} onChange={(e) => setTrainForm({ ...trainForm, datasetId: e.target.value })} required>
              <option value="">Select dataset…</option>
              {datasets.map((d) => <option key={d.id} value={d.id}>{d.dataset_name} ({d.row_count ?? '?'} rows)</option>)}
            </select>
            <label>Model Name</label>
            <input type="text" value={trainForm.modelName} onChange={(e) => setTrainForm({ ...trainForm, modelName: e.target.value })} placeholder="e.g. yield_rf_v1" />
            <label>Target Column</label>
            <input type="text" value={trainForm.targetColumn} onChange={(e) => setTrainForm({ ...trainForm, targetColumn: e.target.value })} required />
            <label>Algorithm</label>
            <select value={trainForm.algorithm} onChange={(e) => setTrainForm({ ...trainForm, algorithm: e.target.value })}>
              {ALGORITHMS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button className="btn btn-primary btn-block mt-3" disabled={training}>
              {training ? 'Training…' : 'Train Model'}
            </button>
          </form>
          {trainOutput && <div className="ml-output mt-3">{trainOutput}</div>}
        </div>
      </div>

      <div className="card">
        <h3>Datasets</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>File</th><th>Rows</th><th>Cols</th><th>Size</th><th>Uploaded By</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {!datasets.length && <tr><td colSpan="8" className="muted">No datasets yet.</td></tr>}
              {datasets.map((d) => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td>{d.dataset_name}</td>
                  <td className="small">{d.original_filename}</td>
                  <td>{d.row_count ?? '—'}</td>
                  <td>{d.column_count ?? '—'}</td>
                  <td>{d.file_size_bytes ? `${(d.file_size_bytes / 1024).toFixed(1)} KB` : '—'}</td>
                  <td className="small">{d.uploaded_by_name || '—'}</td>
                  <td>
                    <div className="actions-inline">
                      <button className="btn-ghost btn-sm" onClick={() => previewDataset(d.id)}>Preview</button>
                      <button className="btn-danger btn-sm" onClick={() => removeDataset(d)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {preview && (
          <div className="mt-3">
            <h4>Preview — {preview.note}</h4>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>{preview.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.rows.map((r, i) => (
                    <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Trained Models</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Dataset</th><th>Algorithm</th><th>Target</th><th>Metrics</th><th>Trained By</th><th>Trained At</th></tr>
            </thead>
            <tbody>
              {!models.length && <tr><td colSpan="8" className="muted">No trained models yet.</td></tr>}
              {models.map((m) => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.model_name}</td>
                  <td className="small">{m.dataset_name || '—'}</td>
                  <td><span className="badge info">{m.algorithm}</span></td>
                  <td className="small">{m.target_column}</td>
                  <td className="small" style={{ maxWidth: 240 }}>{m.metrics_json}</td>
                  <td className="small">{m.trained_by_name || '—'}</td>
                  <td className="small">{m.trained_at ? new Date(m.trained_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}