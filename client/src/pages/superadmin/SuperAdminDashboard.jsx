import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { LayoutDashboard, Users, Tractor, Sprout, CircleUser, UserRound, Crown } from 'lucide-react';

function RoleBadge({ role }) {
  if (role === 'super_admin') return <span className="badge danger">super admin</span>;
  if (role === 'farmer') return <span className="badge success">farmer</span>;
  return <span className="badge info">user</span>;
}

const VIEWS = [
  ['overview', LayoutDashboard, 'Overview'],
  ['users', Users, 'Users'],
  ['farmers', Tractor, 'Farmers'],
];

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState('overview');
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.body.classList.add('admin-theme');
    return () => document.body.classList.remove('admin-theme');
  }, []);

  useEffect(() => {
    api.get('/admin/users')
      .then((res) => setUsers(res.data.data))
      .catch((err) => setError(err.message));
  }, []);

  const load = () =>
    api.get('/admin/users')
      .then((res) => setUsers(res.data.data))
      .catch((err) => setError(err.message));

  const bakedForm = { username: '', email: '', password: '', role: 'user' };
  const [form, setForm] = useState(bakedForm);
  const [showCreate, setShowCreate] = useState(false);

  const createUser = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api.post('/admin/users', form);
      setForm(bakedForm);
      setShowCreate(false);
      setNotice(`Account "${form.username}" created (${form.role}).`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (u) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api.post(`/admin/users/${u.id}/toggle-active`, { userId: u.id, isActive: !u.is_active });
      setNotice(`${u.username} ${u.is_active ? 'deactivated' : 'activated'}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete account "${u.username}"? This cannot be undone.`)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api.delete(`/admin/users/${u.id}`);
      setNotice(`${u.username} deleted.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const setRole = async (u, role) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api.post(`/admin/users/${u.id}/set-role`, { userId: u.id, role });
      setNotice(`${u.username} is now a ${role === 'farmer' ? 'farmer' : 'normal user'}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const counts = useMemo(() => {
    if (!users) return null;
    return {
      total: users.length,
      farmers: users.filter((u) => u.role === 'farmer').length,
      usersCount: users.filter((u) => u.role === 'user').length,
      superAdmins: users.filter((u) => u.role === 'super_admin').length,
    };
  }, [users]);

  const profileRows = useMemo(() => {
    if (!users) return [];
    let rows = view === 'farmers' ? users.filter((u) => u.role === 'farmer') : users.filter((u) => u.role === 'user');
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((u) => (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
    }
    return rows;
  }, [users, view, search]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-icon"><Sprout size={18} /></span>
          <span>Super Admin</span>
        </div>
        <div className="admin-nav">
          {VIEWS.map(([key, Icon, label]) => (
            <button
              key={key}
              className={`admin-nav-item ${view === key ? 'active' : ''}`}
              style={{ border: 'none', fontFamily: 'var(--font)', cursor: 'pointer' }}
              onClick={() => setView(key)}
            >
              <Icon size={17} />
              <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
              {counts && (key === 'users' || key === 'farmers') && (
                <span className="sa-count">{key === 'users' ? counts.usersCount : counts.farmers}</span>
              )}
            </button>
          ))}
        </div>
        <div className="admin-sidebar-footer">
          <span className="badge danger">super admin</span>
          <div className="small" style={{ color: '#a8b6c8', display: 'flex', alignItems: 'center', gap: 8 }}><CircleUser size={15} /> {user?.username}</div>
          <button className="btn-ghost btn-block" style={{ background: 'rgba(255,255,255,.06)', color: '#fca5a5', borderColor: 'rgba(255,255,255,.15)' }} onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <h1 className="admin-title">{view === 'overview' ? 'Overview' : view === 'farmers' ? 'Farmers' : 'Users'}</h1>
        </header>
        <div className="admin-content">
          {error && <div className="alert alert-danger">{error}</div>}
          {notice && <div className="alert alert-success">{notice}</div>}

          {view === 'overview' && counts && (
            <div className="admin-stats">
              <div className="admin-stat">
                <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}><Users size={19} /></div>
                <div><div className="num">{counts.total}</div><div className="label">Total Accounts</div></div>
              </div>
              <div className="admin-stat">
                <div className="stat-icon" style={{ background: '#dcfce7', color: '#15803d' }}><Tractor size={19} /></div>
                <div><div className="num">{counts.farmers}</div><div className="label">Farmers</div></div>
              </div>
              <div className="admin-stat">
                <div className="stat-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}><UserRound size={19} /></div>
                <div><div className="num">{counts.usersCount}</div><div className="label">Normal Users</div></div>
              </div>
              <div className="admin-stat">
                <div className="stat-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}><Crown size={19} /></div>
                <div><div className="num">{counts.superAdmins}</div><div className="label">Super Admins</div></div>
              </div>
            </div>
          )}

          {view !== 'overview' && (
            <div className="card">
              <div className="filter-bar" style={{ marginBottom: 14 }}>
                <div className="field" style={{ flex: 1 }}>
                  <input
                    type="text"
                    placeholder={`Search ${view === 'farmers' ? 'farmer' : 'user'} by name or email…`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button type="button" className="btn btn-primary" onClick={() => setShowCreate((s) => !s)} disabled={busy}>
                  {showCreate ? 'Cancel' : '＋ Create User'}
                </button>
              </div>

              {showCreate && (
                <form className="card card-inner" style={{ marginBottom: 14 }} onSubmit={createUser}>
                  <h4 style={{ marginTop: 0 }}>Create a new account</h4>
                  <div className="form-grid">
                    <div className="field"><label>Username</label><input required minLength={3} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
                    <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                    <div className="field"><label>Password</label><input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                    <div className="field">
                      <label>Role</label>
                      <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                        <option value="user">Normal User</option>
                        <option value="farmer">Farmer</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button type="submit" className="btn btn-primary" disabled={busy}>Create account</button>
                  </div>
                </form>
              )}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {!users && (
                      <tr><td colSpan="7" className="muted text-center">Loading…</td></tr>
                    )}
                    {users && profileRows.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.username}</td>
                        <td>{u.email || '—'}</td>
                        <td><RoleBadge role={u.role} /></td>
                        <td>{u.is_active == 1 ? <span className="badge success">active</span> : <span className="badge danger">inactive</span>}</td>
                        <td className="small">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {u.role === 'user' && (
                              <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => setRole(u, 'farmer')}>↑ Farmer</button>
                            )}
                            {u.role === 'farmer' && (
                              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setRole(u, 'user')}>↓ User</button>
                            )}
                            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => toggleActive(u)}>
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            {u.role !== 'super_admin' && (
                              <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => deleteUser(u)}>Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users && profileRows.length === 0 && (
                      <tr><td colSpan="7" className="muted text-center">No {view} found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}