import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { Newspaper, Plus, Pencil, Trash2 } from 'lucide-react';

const EMPTY = { id: 0, title: '', description: '', url: '', image: '', publishedAt: '' };

export default function AdminNews() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () =>
    api.get('/admin/news')
      .then((r) => setRows(r.data.data))
      .catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      await api.post('/admin/news', form);
      setNotice(form.id ? `News #${form.id} updated.` : 'News published.');
      setForm(EMPTY);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (n) =>
    setForm({
      id: n.id, title: n.title, description: n.description || '',
      url: n.url || '', image: n.image || '',
      publishedAt: n.published_at ? n.published_at.slice(0, 16) : '',
    });

  const remove = async (n) => {
    if (!window.confirm(`Delete news "${n.title}"?`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/admin/news/${n.id}`, { data: { id: n.id } });
      setNotice('News deleted.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="grid-2">
        <form className="card" onSubmit={save}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Newspaper size={18} />
            <h3 style={{ margin: 0 }}>{form.id ? `Edit news #${form.id}` : 'Publish news'}</h3>
          </div>
          <label>Title *</label>
          <input type="text" value={form.title} onChange={set('title')} required />
          <label>Description</label>
          <textarea value={form.description} onChange={set('description')} placeholder="Short summary shown to readers…" />
          <label>Source URL</label>
          <input type="url" value={form.url} onChange={set('url')} placeholder="https://…" />
          <label>Image URL</label>
          <input type="url" value={form.image} onChange={set('image')} placeholder="https://…" />
          <label>Published At</label>
          <input type="datetime-local" value={form.publishedAt} onChange={set('publishedAt')} />
          <div className="actions-inline mt-3">
            <button className="btn btn-primary"><Plus size={16} /> {form.id ? 'Update' : 'Publish'}</button>
            {form.id && <button type="button" className="btn-ghost" onClick={() => setForm(EMPTY)}>Cancel edit</button>}
          </div>
        </form>

        <div className="card">
          <h3>Published news ({rows.length})</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>ID</th><th>Title</th><th>Description</th><th>Published</th><th></th></tr>
              </thead>
              <tbody>
                {!rows.length && <tr><td colSpan="5" className="muted">No news yet.</td></tr>}
                {rows.map((n) => (
                  <tr key={n.id}>
                    <td>{n.id}</td>
                    <td><strong>{n.title}</strong>{n.url && <div className="small muted">{n.url}</div>}</td>
                    <td className="small" style={{ maxWidth: 260 }}>{n.description || '—'}</td>
                    <td className="small">{n.published_at ? new Date(n.published_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="actions-inline">
                        <button className="btn-ghost btn-sm" onClick={() => edit(n)}><Pencil size={13} /> Edit</button>
                        <button className="btn-danger btn-sm" onClick={() => remove(n)}><Trash2 size={13} /> Delete</button>
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