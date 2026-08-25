import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import {
  ShoppingBag, ClipboardList, IndianRupee, ArrowUpRight, Sprout, TrendingUp,
  Truck, Banknote, Wallet, CheckCircle2, XCircle, Package, Trash2,
} from 'lucide-react';
import OrderDetailModal from '../../components/OrderDetailModal.jsx';

const STATUS_BADGE = {
  pending: 'warning', confirmed: 'info', processing: 'info', packed: 'info',
  shipped: 'info', out_for_delivery: 'info', delivered: 'success', cancelled: 'danger',
};

const PAY_LABEL = { cod: 'Cash on delivery', khalti: 'Khalti (paid online)' };

function npr(n) {
  return `रू ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function GrowthChart({ data }) {
  if (!data || !data.length) return <p className="muted small">No sales data yet.</p>;
  const W = 600, H = 210, P = 28, BW = 34;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const innerW = W - P * 2, innerH = H - P * 2;
  const x = (i) => P + (i / (data.length - 1)) * innerW;
  const y = (v) => P + innerH - (v / max) * innerH;
  const steps = data.map((d, i) => `${x(i).toFixed(1)},${y(d.revenue).toFixed(1)}`);
  const line = `M ${steps.join(' L ')}`;
  const area = `${line} L ${x(data.length - 1).toFixed(1)},${P + innerH} L ${x(0).toFixed(1)},${P + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fa-chart" role="img" aria-label="Earnings growth over the last 14 days">
      <defs>
        <linearGradient id="faChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f6f4f" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2f6f4f" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f) => (
        <line key={f} x1={P} x2={W - P} y1={P + innerH * f} y2={P + innerH * f} stroke="#e5ecdf" strokeDasharray="4 5" />
      ))}
      <path d={area} fill="url(#faChartFill)" />
      <path d={line} fill="none" stroke="#2f6f4f" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.revenue)} r="3.4" fill="#fff" stroke="#2f6f4f" strokeWidth="2">
            <title>{`${d.label}: ${npr(d.revenue)} · ${d.orders} order(s)`}</title>
          </circle>
        </g>
      ))}
      {data.map((d, i) => (
        i % 2 === 0 ? (
          <text key={`l${i}`} x={x(i)} y={H - 8} textAnchor="middle" className="fa-chart-label">{d.label}</text>
        ) : null
      ))}
      <text x={6} y={y(max)} className="fa-chart-label" textAnchor="start">{npr(max)}</text>
      <text x={6} y={y(max / 2)} className="fa-chart-label" textAnchor="start">{npr(max / 2)}</text>
    </svg>
  );
}

export default function FarmerOverview() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [activeOrderId, setActiveOrderId] = useState(null);

  const load = () =>
    api.get('/admin/farmer/summary')
      .then((r) => setSummary(r.data.data))
      .catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!summary) return <div className="page-loader">Loading your farm…</div>;

  const payments = summary.payments || [];
  const paidTotal = payments.reduce((s, p) => s + (p.payment_method === 'khalti' ? Number(p.amount || 0) : 0), 0);
  const codTotal = payments.reduce((s, p) => s + (p.payment_method === 'cod' ? Number(p.amount || 0) : 0), 0);
  const counts = Object.fromEntries((summary.statusCounts || []).map((s) => [s.status, s.c]));
  const topRevenue = (summary.topProducts || [])[0]?.revenue || 1;

  return (
    <div>
      <OrderDetailModal orderId={activeOrderId} onClose={() => setActiveOrderId(null)} onChanged={load} />
      <div className="admin-stats">
        <Link to="/farmer/products" className="admin-stat" style={{ textDecoration: 'none' }}>
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}><ShoppingBag size={19} /></div>
          <div>
            <div className="num">{summary.myProducts}</div>
            <div className="label">Products listed</div>
          </div>
        </Link>
        <Link to="/farmer/sales" className="admin-stat" style={{ textDecoration: 'none' }}>
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}><ClipboardList size={19} /></div>
          <div>
            <div className="num">{summary.mySales}</div>
            <div className="label">Orders received</div>
          </div>
        </Link>
        <div className="admin-stat">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#15803d' }}><IndianRupee size={19} /></div>
          <div>
            <div className="num">{npr(summary.revenue)}</div>
            <div className="label">Total earnings (NPR)</div>
          </div>
        </div>
        <Link
          to={summary.pendingDeliveries ? '/farmer/sales?filter=active' : '/farmer/sales'}
          className="admin-stat"
          style={{ textDecoration: 'none' }}
        >
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}><Truck size={19} /></div>
          <div>
            <div className="num">{summary.pendingDeliveries}</div>
            <div className="label">Pending deliveries</div>
          </div>
        </Link>
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="fa-card-head">
            <h3 style={{ margin: 0 }}><TrendingUp size={16} style={{ verticalAlign: '-2px' }} /> Earnings growth</h3>
            <span className="small muted">last 14 days</span>
          </div>
          <div className="fa-chart-wrap"><GrowthChart data={summary.growthChart} /></div>
        </div>

        <div className="card">
          <div className="fa-card-head">
            <h3 style={{ margin: 0 }}><Package size={16} style={{ verticalAlign: '-2px' }} /> Most sold products</h3>
            <span className="small muted">by quantity</span>
          </div>
          {(summary.topProducts || []).length === 0 ? (
            <p className="muted small">No sales yet — your best sellers will appear here.</p>
          ) : (
            <div className="fa-top">
              {(summary.topProducts || []).map((p, i) => (
                <div key={i} className="fa-top-row">
                  <span className="fa-top-rank">{i + 1}</span>
                  <div className="fa-top-name">
                    <strong>{p.product_name}</strong>
                    <span className="muted small">{p.qty} sold</span>
                  </div>
                  <div className="fa-top-bar"><span style={{ width: `${Math.min(100, (p.revenue / topRevenue) * 100)}%` }} /></div>
                  <span className="fa-top-val">{npr(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="fa-card-head">
            <h3 style={{ margin: 0 }}><Wallet size={16} style={{ verticalAlign: '-2px' }} /> Payments</h3>
            <span className="small muted">how buyers paid</span>
          </div>
          <div className="fa-pay">
            <div className="fa-pay-row">
              <span className="fa-pay-icon"><Banknote size={16} /></span>
              <div className="fa-pay-info">
                <strong>{PAY_LABEL.cod}</strong>
                <span className="muted small">{payments.find((x) => x.payment_method === 'cod')?.c || 0} orders</span>
              </div>
              <div className="fa-pay-bar"><span style={{ width: `${Math.min(100, (codTotal / Math.max(codTotal + paidTotal, 1)) * 100)}%` }} /></div>
              <span className="fa-pay-val">{npr(codTotal)}</span>
            </div>
            <div className="fa-pay-row">
              <span className="fa-pay-icon khalti"><Wallet size={16} /></span>
              <div className="fa-pay-info">
                <strong>{PAY_LABEL.khalti}</strong>
                <span className="muted small">{payments.find((x) => x.payment_method === 'khalti')?.c || 0} orders · paid online</span>
              </div>
              <div className="fa-pay-bar"><span style={{ width: `${Math.min(100, (paidTotal / Math.max(codTotal + paidTotal, 1)) * 100)}%` }} /></div>
              <span className="fa-pay-val">{npr(paidTotal)}</span>
            </div>
            <div className="fa-pay-foot">
              <span><CheckCircle2 size={14} /> {counts.delivered || 0} delivered</span>
              <span><XCircle size={14} /> {counts.cancelled || 0} cancelled</span>
              <span><Truck size={14} /> {counts.pending || 0} waiting</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}><ClipboardList size={16} style={{ verticalAlign: '-2px' }} /> Recent orders</h3>
            <Link to="/farmer/sales" className="land-link">All sales →</Link>
          </div>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr><th>Order</th><th>Items</th><th>Buyer</th><th>Total</th><th>Status</th><th>Date</th><th>&nbsp;</th></tr>
              </thead>
              <tbody>
                {!summary.recentSales.length && <tr><td colSpan="7" className="muted">No orders yet — buyers will appear here.</td></tr>}
                {summary.recentSales.map((o) => (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setActiveOrderId(o.id)}>
                    <td>#{o.id}</td>
                    <td className="small" style={{ maxWidth: 240 }}>{o.items_preview || '—'}</td>
                    <td className="small">{o.customer_name}</td>
                    <td>{npr(o.total_amount)}</td>
                    <td><span className={`badge ${STATUS_BADGE[o.status] || 'info'}`}>{o.status}</span></td>
                    <td className="small">{new Date(o.order_date).toLocaleDateString()}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-ghost btn-sm"
                        title="Delete order"
                        onClick={async (e) => {
                          if (!window.confirm(`Delete order #${o.id}? This removes it from both sides and cannot be undone.`)) return;
                          try {
                            await api.delete(`/admin/farmer/orders/${o.id}`);
                            await load();
                          } catch (err) {
                            setError(err.message);
                          }
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <Link to="/farmer/products" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h3 style={{ marginBottom: 4 }}>My Products</h3><p className="muted small" style={{ margin: 0 }}>Manage what you sell on the marketplace.</p></div>
          <ArrowUpRight size={22} style={{ color: 'var(--rust)' }} />
        </Link>
        <Link to="/add-product" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h3 style={{ marginBottom: 4 }}>List a product</h3><p className="muted small" style={{ margin: 0 }}>Put fresh produce or inputs in front of buyers.</p></div>
          <ArrowUpRight size={22} style={{ color: 'var(--rust)' }} />
        </Link>
      </div>
    </div>
  );
}