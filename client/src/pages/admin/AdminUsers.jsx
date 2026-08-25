import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Users, Tractor, UserRound, Store, Crown, Search, UserPlus } from 'lucide-react';

function RoleBadge({ role }) {
  if (role === 'super_admin') return <span className="badge danger">super admin</span>;
  if (role === 'farmer') return <span className="badge success">farmer</span>;
  if (role === 'vendor') return <span className="badge warning">vendor</span>;
  return <span className="badge info">user</span>;
}

const FILTERS = [
  ['all', 'All'],
  ['farmer', 'Farmers'],
  ['user', 'Normal Users'],
  ['vendor', 'Vendors'],
];

export default function AdminUsers() {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');

  const load = () =>
    api.get('/admin/users')
      .then((res) => setUsers(res.data.data))
      .catch((err) => setError(err.message));

  useEffect(() => { load(); }, []);

  const act = async (fn, okMsg) => {
    try {
      await fn();
      setNotice(okMsg);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = (u) =>
    act(
      () => api.post(`/admin/users/${u.id}/toggle-active`, { isActive: u.is_active == 1 ? 0 : 1 }),
      `User "${u.username}" status updated.`
    );

  const setRole = (u, role) =>
    act(() => api.post(`/admin/users/${u.id}/set-role`, { role }), `Role updated for "${u.username}".`);

  const resetPassword = (u) => {
    const pass = window.prompt(`New password for ${u.username} (min 8 chars):`);
    if (!pass) return;
    act(() => api.post(`/admin/users/${u.id}/reset-password`, { newPassword: pass }), 'Password reset completed.');
  };

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }
  if (!users) return <div className="page-loader">Loading users…</div>;

  const count = (r) => users.filter((u) => u.role === r).length;
  const visible = filter === 'all' ? users : users.filter((u) => u.role === filter);

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}><Users size={19} /></div>
          <div><div className="num">{users.length}</div><div className="label">Total Users</div></div>
        </div>
        <div className="admin-stat">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#15803d' }}><Tractor size={19} /></div>
          <div><div className="num">{count('farmer')}</div><div className="label">Farmers</div></div>
        </div>
        <div className="admin-stat">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}><UserRound size={19} /></div>
          <div><div className="num">{count('user')}</div><div className="label">Normal Users</div></div>
        </div>
        <div className="admin-stat">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}><Store size={19} /></div>
          <div><div className="num">{count('vendor')}</div><div className="label">Vendors</div></div>
        </div>
        <div className="admin-stat">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}><Crown size={19} /></div>
          <div><div className="num">{count('super_admin')}</div><div className="label">Super Admins</div></div>
        </div>
      </div>

      <div className="card">
        <h3>{isSuperAdmin ? 'Farmers & Users — Super Admin Overview' : 'Manage Users, Roles, and Access'}</h3>
        <p className="muted">Only the Super Admin can change roles.</p>
        {notice && <div className="alert alert-success">{notice}</div>}

        <div className="actions-inline" style={{ marginBottom: 14 }}>
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              className={key === filter ? 'btn btn-primary btn-sm' : 'btn-ghost btn-sm'}
              onClick={() => setFilter(key)}
            >
              {label} ({key === 'all' ? users.length : count(key)})
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}{u.role === 'super_admin' && <Crown size={12} style={{ marginLeft: 6, verticalAlign: -1 }} />}</td>
                  <td>{u.email || '—'}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>{u.is_active == 1 ? <span className="badge success">active</span> : <span className="badge danger">inactive</span>}</td>
                  <td className="small">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <div className="actions-inline">
                      {isSuperAdmin && u.role === 'user' && (
                        <button className="btn-ghost btn-sm" title="Promote to farmer" onClick={() => setRole(u, 'farmer')}>↑ Farmer</button>
                      )}
                      {isSuperAdmin && ['farmer', 'vendor'].includes(u.role) && (
                        <button className="btn-ghost btn-sm" title="Demote to normal user" onClick={() => setRole(u, 'user')}>↓ User</button>
                      )}
                      <button className="btn-warning btn-sm" onClick={() => toggleActive(u)}>
                        {u.is_active == 1 ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn-danger btn-sm" onClick={() => resetPassword(u)}>Reset Password</button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan="7" className="muted text-center">No {filter === 'all' ? '' : `${filter} `}users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}