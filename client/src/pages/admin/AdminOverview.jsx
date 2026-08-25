import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { STAT_ICONS } from '../../components/AdminLayout.jsx';

const STAT_LABELS = [
  ['users', 'Total Users'],
  ['activeUsers', 'Active Users'],
  ['products', 'Products'],
  ['orders', 'Orders'],
  ['pendingOrders', 'Pending Orders'],
  ['news', 'News'],
  ['datasets', 'ML Datasets'],
  ['models', 'ML Models'],
  ['totalRevenue', 'Revenue (₹)'],
];

const STAT_COLORS = {
  'Total Users': ['#e0f2fe', '#0369a1'],
  'Active Users': ['#dcfce7', '#15803d'],
  'Products': ['#fef3c7', '#b45309'],
  'Orders': ['#ede9fe', '#6d28d9'],
  'Pending Orders': ['#fee2e2', '#b91c1c'],
  'News': ['#fce7f3', '#be185d'],
  'ML Datasets': ['#d1fae5', '#047857'],
  'ML Models': ['#e0f2fe', '#1d4ed8'],
  'Revenue (₹)': ['#fef9c3', '#a16207'],
};

const BAR_COLORS = ['#2f9e44', '#1971c2', '#e8590c'];
const PIE_COLORS = ['#2f9e44', '#1971c2', '#e8590c', '#7048e8'];

function BarChart({ data }) {
  const labels = ['Users', 'Products', 'Orders'];
  const max = Math.max(...data, 1);
  return (
    <svg viewBox="0 0 300 180" role="img" aria-label="Users, products and orders bar chart">
      {[0, 1, 2].map((i) => {
        const h = Math.max((data[i] / max) * 110, 2);
        const x = 40 + i * 95;
        return (
          <g key={labels[i]}>
            <rect x={x} y={160 - h} width="55" height={h} rx="4" fill={BAR_COLORS[i]} />
            <text x={x + 27} y={160 - h - 6} textAnchor="middle" fontSize="12" fontWeight="600" fill="#343a40">{data[i]}</text>
            <text x={x + 27} y="176" textAnchor="middle" fontSize="11" fill="#868e96">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function PieChart({ data, labels = [], centerLabel = 'Total' }) {
  const total = data.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  const segs = data.map((v, i) => {
    const start = acc;
    acc += (v / total) * 360;
    return { ...slicePath(start, acc), color: PIE_COLORS[i], value: v, label: labels[i] || `Group ${i + 1}` };
  });
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 42 42" role="img" aria-label="Role distribution pie chart">
        {segs.map((s, i) => (
          <circle key={s.label} cx="21" cy="21" r="15.915" fill="transparent" stroke={s.color} strokeWidth="6.5" strokeDasharray={`${s.dash} ${100 - s.dash}`} strokeDashoffset="25" />
        ))}
        <text x="21" y="20.4" textAnchor="middle" dy="0.35em" fontSize="6" fontWeight="700" fill="#343a40">{segs.length ? total : 0}</text>
        <text x="21" y="25.2" textAnchor="middle" fontSize="2.6" fill="#868e96" fontWeight="500">{centerLabel}</text>
      </svg>
      <div className="donut-legend">
        {segs.map((s) => (
          <span key={s.label}><i style={{ background: s.color }} /> {s.label} ({s.value})</span>
        ))}
      </div>
    </div>
  );
}

function slicePath(startDeg, endDeg) {
  const len = Math.max(((endDeg - startDeg) / 360) * 100, 0.001);
  return { dash: len };
}

export default function AdminOverview() {
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard/summary'),
      api.get('/admin/dashboard/recent-activity'),
      api.get('/admin/users'),
    ])
      .then(([s, a, u]) => {
        setSummary(s.data.data);
        setActivity(a.data.data || []);
        const roleCount = (r) => (u.data.data || []).filter((x) => x.role === r).length;
        setRoles([
          ['Normal Users', roleCount('user')],
          ['Farmers', roleCount('farmer')],
          ['Vendors', roleCount('vendor')],
          ['Super Admins', roleCount('super_admin')],
        ]);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!summary) return <div className="page-loader">Loading dashboard…</div>;

  return (
    <div>
      <div className="admin-stats">
        {STAT_LABELS.map(([key, label]) => {
          const [bg, fg] = STAT_COLORS[label] || ['#f3f4f6', '#374151'];
          const Icon = STAT_ICONS[label];
          return (
            <div className="admin-stat" key={key}>
              <div className="stat-icon" style={{ background: bg, color: fg }}><Icon size={19} /></div>
              <div>
                <div className="num">{key === 'totalRevenue' ? `₹${summary[key]}` : summary[key]}</div>
                <div className="label">{label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="charts-row">
        <div className="card"><h3>Overview</h3><BarChart data={[summary.users, summary.products, summary.orders]} /></div>
        <div className="card"><h3>Share</h3><PieChart data={roles.map((r) => r[1])} labels={roles.map((r) => r[0])} centerLabel="Accounts" /></div>
      </div>

      <div className="card">
        <h3>Recent Activity</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Admin</th><th>Module</th><th>Action</th><th>Details</th><th>Time</th></tr>
            </thead>
            <tbody>
              {!activity.length && <tr><td colSpan="5" className="muted">No activity yet.</td></tr>}
              {activity.slice(0, 10).map((a) => (
                <tr key={a.id}>
                  <td>{a.username || '—'}</td>
                  <td><span className="badge info">{a.module}</span></td>
                  <td>{a.action}</td>
                  <td className="small">{a.details}</td>
                  <td className="small">{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}