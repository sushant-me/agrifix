import { useEffect, useState } from 'react';
import api from '../../api/client.js';

const MODULES = ['users', 'products', 'orders', 'ml', 'auth', 'support', 'cart', 'payment', 'farm', 'weather', 'marketplace'];

export default function AdminActivityLog() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');
  const [module, setModule] = useState('');

  useEffect(() => {
    api.get('/admin/dashboard/recent-activity')
      .then((res) => setLogs(res.data.data || []))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!logs) return <div className="page-loader">Loading activity log…</div>;

  const visible = module ? logs.filter((l) => l.module === module) : logs;

  return (
    <div className="card">
      <h3>Admin Activity Log</h3>
      <p className="muted">Every panel action — role changes, product edits, orders, ML training — is recorded here.</p>

      <div className="actions-inline" style={{ marginBottom: 14 }}>
        <button className={module === '' ? 'btn btn-primary btn-sm' : 'btn-ghost btn-sm'} onClick={() => setModule('')}>
          All ({logs.length})
        </button>
        {MODULES.map((m) => (
          <button key={m} className={module === m ? 'btn btn-primary btn-sm' : 'btn-ghost btn-sm'} onClick={() => setModule(m)}>
            {m} ({logs.filter((l) => l.module === m).length})
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Admin</th><th>Module</th><th>Action</th><th>Details</th><th>Time</th></tr>
          </thead>
          <tbody>
            {visible.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>{l.username || '—'}</td>
                <td><span className="badge info">{l.module}</span></td>
                <td>{l.action}</td>
                <td className="small">{l.details}</td>
                <td className="small">{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan="6" className="muted text-center">No activity in this module yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}