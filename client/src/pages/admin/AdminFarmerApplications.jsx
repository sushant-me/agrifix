import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { CheckCircle2, XCircle, Clock, FileText, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

const TABS = [
  ['', 'All'],
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
];

const BADGE = { pending: 'warning', approved: 'success', rejected: 'danger' };

export default function AdminFarmerApplications() {
  const [tab, setTab] = useState('pending');
  const [apps, setApps] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');

  const load = (status) => {
    setApps(null);
    api.get(`/admin/farmer-applications${status ? `?status=${status}` : ''}`)
      .then((r) => setApps(r.data.data))
      .catch((e) => setError(e.message));
  };

  useEffect(() => { load(tab); }, [tab]);

  const counts = (apps || []).reduce((c, a) => { c[a.status] = (c[a.status] || 0) + 1; return c; }, {});

  const review = async (action) => {
    if (!selected) return;
    setBusy(true);
    setFlash('');
    try {
      const res = await api.patch(`/admin/farmer-applications/${selected.id}`, { action, note: note.trim() });
      setFlash(res.data.message || `${action} saved.`);
      setNote('');
      setSelected(null);
      load(tab);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const openApp = (a) => { setSelected(a); setNote(''); setError(''); };

  return (
    <div>
      <div className="admin-fa-head">
        <div>
          <h2 style={{ margin: 0 }}>Farmer Applications</h2>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            Review documents and approve farmers to sell on the marketplace.
          </p>
        </div>
        <div className="admin-fa-counts">
          <span className="badge info">{apps ? apps.length : '…'} shown</span>
          {counts.pending > 0 && <span className="badge warning">{counts.pending} pending</span>}
        </div>
      </div>

      <div className="admin-fa-tabs">
        {TABS.map(([val, label]) => (
          <button key={val} type="button" className={`admin-fa-tab ${tab === val ? 'active' : ''}`} onClick={() => setTab(val)}>
            {label}
          </button>
        ))}
      </div>

      {flash && <div className="alert alert-success">{flash}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!apps ? (
        <div className="page-loader">Loading applications…</div>
      ) : !apps.length ? (
        <div className="card admin-fa-empty">
          <FileText size={26} />
          <p className="muted">No {tab} applications right now.</p>
        </div>
      ) : (
        <div className="admin-fa-grid">
          {apps.map((a) => (
            <div key={a.id} className={`card admin-fa-card ${selected?.id === a.id ? 'sel' : ''}`} onClick={() => openApp(a)}>
              <div className="admin-fa-top">
                <div className="admin-fa-avatar">
                  {a.avatar_url ? <img src={a.avatar_url} alt={a.username} /> : <span>{a.username?.[0]?.toUpperCase()}</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <strong className="admin-fa-name">{a.full_name}</strong>
                  <div className="small muted">@{a.username} {a.email ? `· ${a.email}` : ''}</div>
                </div>
                <span className={`badge ${BADGE[a.status] || 'info'}`}>{a.status}</span>
              </div>

              <div className="admin-fa-meta">
                <span className="small muted">Citizenship</span>
                <strong className="small">{a.citizenship_no}</strong>
              </div>
              <div className="admin-fa-meta">
                <span className="small muted">Selling</span>
                <span className="admin-fa-chips">{a.sell_items.split(',').slice(0, 4).map((s, i) => <em key={i}>{s.trim()}</em>)}</span>
              </div>

              <div className="admin-fa-docs">
                {[['Citizenship', a.citizenship_doc], ['Kisan card', a.kisan_doc]].map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noreferrer" className="admin-fa-doc" onClick={(e) => e.stopPropagation()} title={`Open ${label}`}>
                    <FileText size={15} /> {label} <ExternalLink size={11} />
                  </a>
                ))}
              </div>

              <p className="small admin-fa-desc">{a.description || '—'}</p>

              <div className="admin-fa-foot">
                <span className="small muted">#{a.id} · {new Date(a.created_at).toLocaleDateString()}</span>
                {a.status === 'pending'
                  ? <span className="admin-fa-open">Review <ChevronRight size={14} /></span>
                  : a.admin_note && <span className="small muted" title={a.admin_note}>note: {a.admin_note.slice(0, 28)}…</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fa-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="fa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fa-modal-head">
              <div>
                <h3 style={{ margin: 0 }}>{selected.full_name}</h3>
                <p className="muted small" style={{ margin: '3px 0 0' }}>
                  @{selected.username} · #{selected.id} · submitted {new Date(selected.created_at).toLocaleString()}
                </p>
              </div>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setSelected(null)}><ChevronLeft size={15} /> Close</button>
            </div>

            <div className="fa-modal-docs">
              {[['Citizenship document', selected.citizenship_doc], ['Kisan card', selected.kisan_doc]].map(([label, url]) => (
                <figure key={label}>
                  <img src={url} alt={label} />
                  <figcaption>
                    <a href={url} target="_blank" rel="noreferrer"><ExternalLink size={12} /> Open full size</a>
                    <span className="muted small">{label}</span>
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="fa-modal-rows">
              <div><span>Full name</span><strong>{selected.full_name}</strong></div>
              <div><span>Citizenship no.</span><strong>{selected.citizenship_no}</strong></div>
              <div><span>Phone</span><strong>{selected.phone_number || '—'}</strong></div>
              <div><span>Wants to sell</span><strong>{selected.sell_items}</strong></div>
              <div><span>Description</span><strong className="fa-modal-desc">{selected.description}</strong></div>
              <div><span>Seller profile</span><strong>{selected.seller_profile_id ? <span className="badge success">created</span> : <span className="badge info">none yet</span>}</strong></div>
            </div>

            {selected.status === 'pending' && (
              <div className="fa-modal-review">
                <textarea
                  rows={2}
                  placeholder={busy ? 'Working…' : 'Approval note (optional) or rejection reason (required for rejection)'}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="fa-modal-actions">
                  <button type="button" className="btn btn-danger" disabled={busy} onClick={() => review('reject')}>
                    <XCircle size={15} /> Reject
                  </button>
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={() => review('approve')}>
                    <CheckCircle2 size={15} /> Approve &amp; activate seller
                  </button>
                </div>
                <p className="muted small" style={{ margin: '8px 0 0' }}>Approval instantly creates the seller profile, flips the role to farmer and lets them list products. Rejection requires a reason.</p>
              </div>
            )}

            {selected.status !== 'pending' && (
              <div className={`fa-modal-done ${selected.status}`}>
                {selected.status === 'approved' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {selected.status === 'approved' ? 'Approved' : 'Rejected'} by admin
                {selected.admin_note && <em>— “{selected.admin_note}”</em>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}