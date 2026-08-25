import { useEffect, useState } from 'react';
import api from '../../api/client.js';

const MODULES = {
  irrigation: {
    fields: [
      ['farm_zone', 'Farm Zone', 'text'], ['start_time', 'Start Time', 'datetime-local'],
      ['duration_minutes', 'Duration (min)', 'number'], ['status', 'Status', 'select'],
      ['notes', 'Notes', 'text'],
    ],
    options: { status: ['scheduled', 'running', 'completed', 'paused'] },
  },
  soil: {
    fields: [
      ['farm_zone', 'Farm Zone', 'text'], ['ph_value', 'pH', 'number'],
      ['nitrogen_level', 'Nitrogen', 'text'], ['phosphorus_level', 'Phosphorus', 'text'],
      ['potassium_level', 'Potassium', 'text'], ['recorded_at', 'Recorded At', 'datetime-local'],
      ['remarks', 'Remarks', 'text'],
    ],
  },
  tasks: {
    fields: [
      ['task_name', 'Task Name', 'text'], ['assigned_to', 'Assigned To', 'text'],
      ['due_date', 'Due Date', 'datetime-local'], ['priority', 'Priority', 'select'],
      ['status', 'Status', 'select'], ['notes', 'Notes', 'text'],
    ],
    options: { priority: ['low', 'medium', 'high'], status: ['pending', 'in_progress', 'done', 'cancelled'] },
  },
  weather: {
    fields: [
      ['location', 'Location', 'text'], ['temperature', 'Temperature', 'number'],
      ['humidity', 'Humidity', 'number'], ['rainfall_mm', 'Rainfall (mm)', 'number'],
      ['wind_speed', 'Wind Speed', 'number'], ['report_time', 'Report Time', 'datetime-local'],
      ['source', 'Source', 'text'],
    ],
  },
  devices: {
    fields: [
      ['device_name', 'Device Name', 'text'], ['device_type', 'Device Type', 'text'],
      ['farm_zone', 'Farm Zone', 'text'], ['is_online', 'Online', 'checkbox'],
      ['last_seen', 'Last Seen', 'datetime-local'], ['metadata_json', 'Metadata JSON', 'text'],
    ],
  },
};

export default function AdminFarm() {
  const [module, setModule] = useState('tasks');
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ id: 0 });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const config = MODULES[module];

  const load = () =>
    api.get('/admin/farm', { params: { module } })
      .then((res) => setRows(res.data.data || []))
      .catch((err) => setError(err.message));

  useEffect(() => {
    setForm({ id: 0 });
    setError('');
    load();
  }, [module]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      await api.post('/admin/farm', { module, ...form });
      setNotice('Saved.');
      setForm({ id: 0 });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (row) => setForm({ ...row });

  const remove = async (row) => {
    if (!window.confirm(`Delete record #${row.id}?`)) return;
    await api.delete(`/admin/farm/${module}/${row.id}`);
    await load();
  };

  const keys = rows.length ? Object.keys(rows[0]).filter((k) => !['created_at', 'updated_at'].includes(k)) : [];

  return (
    <div>
      <div className="actions-inline mb-3">
        {Object.keys(MODULES).map((m) => (
          <button key={m} className={`btn-ghost ${m === module ? 'btn-primary' : ''}`} onClick={() => setModule(m)}>
            {m}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="grid-2">
        <form className="card" onSubmit={save}>
          <h3>{form.id ? `Edit ${module} #${form.id}` : `Add ${module} record`}</h3>
          {config.fields.map(([key, label, type]) => {
            if (type === 'select') {
              return (
                <div key={key}>
                  <label>{label}</label>
                  <select value={form[key] ?? ''} onChange={set(key)}>
                    {config.options[key].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              );
            }
            if (type === 'checkbox') {
              return (
                <label key={key} style={{ fontWeight: 400, display: 'flex', gap: 8, alignItems: 'center', marginTop: 14 }}>
                  <input type="checkbox" checked={form[key] == 1} onChange={set(key)} /> {label}
                </label>
              );
            }
            return (
              <div key={key}>
                <label>{label}</label>
                <input type={type} step="any" value={form[key] ?? ''} onChange={set(key)} />
              </div>
            );
          })}
          <button className="btn btn-primary btn-block mt-3">{form.id ? 'Update' : 'Add Record'}</button>
        </form>

        <div className="card">
          <h3>{module} records ({rows.length})</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>{keys.map((k) => <th key={k}>{k}</th>)}<th></th></tr>
              </thead>
              <tbody>
                {!rows.length && <tr><td colSpan={keys.length + 1} className="muted">No records.</td></tr>}
                {rows.map((r) => (
                  <tr key={r.id}>
                    {keys.map((k) => (
                      <td key={k} className="small">{String(r[k] ?? '')}</td>
                    ))}
                    <td>
                      <div className="actions-inline">
                        <button className="btn-ghost btn-sm" onClick={() => edit(r)}>Edit</button>
                        <button className="btn-danger btn-sm" onClick={() => remove(r)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}