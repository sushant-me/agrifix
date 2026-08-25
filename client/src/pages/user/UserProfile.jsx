import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CircleUser, MessageCircle, User, Package, ShoppingCart, Heart,
  Camera, Phone, MapPin, CalendarDays, Pencil, Check, X, Tractor, Clock, CheckCircle2, XCircle, ArrowRight,
  Crown, UserRound,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

const TABS = [
  { key: 'overview', label: 'Overview', icon: User },
  { key: 'orders', label: 'Orders', icon: Package },
  { key: 'cart', label: 'Cart', icon: ShoppingCart },
  { key: 'wishlist', label: 'Wishlist', icon: Heart },
  { key: 'chats', label: 'Chats', icon: MessageCircle },
];

function RoleChip({ role }) {
  const isFarmer = role === 'farmer';
  const isAdmin = role === 'super_admin';
  const Icon = isFarmer ? Tractor : isAdmin ? Crown : UserRound;
  return (
    <span className={`badge ${isFarmer ? 'success' : isAdmin ? 'danger' : 'info'} chat-role-chip`} title="Sender role">
      <Icon size={10} style={{ verticalAlign: '-1px' }} />
      {isFarmer ? 'Farmer' : isAdmin ? 'Super admin' : 'User'}
    </span>
  );
}
const HEARTBEAT_MS = 40000;
const CHAT_POLL_MS = 5000;
const STATUS_POLL_MS = 20000;

function fmtDate(ts) {
  return ts ? new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

function timeAgo(ts) {
  if (!ts) return 'offline';
  const secs = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000);
  if (secs < 90) return 'online';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function fmtClock(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function roleLabel(role) {
  return { super_admin: 'Super Admin', farmer: 'Farmer', user: 'Buyer' }[role] || role;
}

function lastSeenText(status) {
  if (!status || !status.lastSeenAt) return 'Offline';
  return status.online ? 'Online' : `Last seen ${timeAgo(status.lastSeenAt)}`;
}

const STATUS_CLASS = {
  delivered: 'success', cancelled: 'danger', confirmed: 'info', processing: 'info',
  packed: 'info', shipped: 'info', out_for_delivery: 'info', pending: 'warning',
};

export default function UserProfile() {
  const { user, refresh } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'overview';
  const openChat = Number(params.get('chat')) || 0;

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState(null);
  const [refunds, setRefunds] = useState(null);
  const [cart, setCart] = useState(null);
  const [wishlist, setWishlist] = useState(null);
  const [convs, setConvs] = useState(null);
  const [messages, setMessages] = useState(null);
  const [activeConv, setActiveConv] = useState(openChat);
  const [otherStatus, setOtherStatus] = useState(null);
  const [msg, setMsg] = useState('');
  const [flash, setFlash] = useState({ ok: '', err: '' });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phoneNumber: '', deliveryAddress: '' });
  const [refundForm, setRefundForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [faStatus, setFaStatus] = useState(null);
  const fileRef = useRef(null);
  const threadRef = useRef(null);

  const setTab = (t) => setParams(t === 'overview' ? {} : { tab: t });

  const loadProfile = useCallback(() => {
    api.get('/user/profile').then((res) => {
      setProfile(res.data.data);
      setEditForm((f) => ({
        ...f,
        name: res.data.data.user.name || '',
        username: res.data.data.user.username || '',
        email: res.data.data.user.email || '',
        phoneNumber: res.data.data.user.phone_number || '',
        deliveryAddress: res.data.data.user.delivery_address || '',
      }));
    }).catch(() => {});
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useEffect(() => {
    api.get('/user/farmer-application')
      .then((r) => setFaStatus({ app: r.data.data, isSeller: r.data.isSeller }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/orders').then((r) => setOrders(r.data.data)).catch(() => {});
    api.get('/user/refunds').then((r) => setRefunds(r.data.data)).catch(() => {});
    api.get('/cart').then((r) => setCart(r.data.data)).catch(() => {});
    api.get('/wishlist').then((r) => setWishlist(r.data.data)).catch(() => {});
    api.get('/conversations').then((r) => {
      setConvs(r.data.data);
      setActiveConv((cur) => cur || openChat || (r.data.data[0] ? r.data.data[0].id : 0));
    }).catch(() => {});
  }, []);

  useEffect(() => { setActiveConv(openChat || activeConv); }, [openChat]);

  const loadMessages = useCallback((convId) => {
    if (!convId) return;
    api.get(`/conversations/${convId}/messages`).then((r) => {
      setMessages(r.data.data.messages);
      setOtherStatus(r.data.data.conversation.otherUser);
      setConvs((cs) => (cs || []).map((c) => (c.id === convId ? r.data.data.conversation : c)));
    }).catch(() => {});
  }, []);

  useEffect(() => { loadMessages(activeConv); }, [activeConv, loadMessages]);

  useEffect(() => {
    if (!activeConv) return;
    const id = setInterval(() => loadMessages(activeConv), CHAT_POLL_MS);
    return () => clearInterval(id);
  }, [activeConv, loadMessages]);

  useEffect(() => {
    if (!activeConv || !otherStatus?.id) return;
    const id = setInterval(() => {
      api.get(`/users/${otherStatus.id}/status`).then((r) => setOtherStatus((s) => ({ ...s, online: r.data.data.online, lastSeenAt: r.data.data.lastSeenAt }))).catch(() => {});
    }, STATUS_POLL_MS);
    return () => clearInterval(id);
  }, [activeConv, otherStatus]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    api.post('/chat/heartbeat').catch(() => {});
    const id = setInterval(() => api.post('/chat/heartbeat').catch(() => {}), HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (tab !== 'chats') return;
    const id = setInterval(() => api.get('/conversations').then((r) => setConvs(r.data.data)).catch(() => {}), 30000);
    return () => clearInterval(id);
  }, [tab]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setFlash({ ok: '', err: '' });
    try {
      await api.patch('/user/profile', editForm);
      setFlash({ ok: 'Profile updated.', err: '' });
      setEditing(false);
      loadProfile();
      refresh();
    } catch (err) {
      setFlash({ ok: '', err: err.message });
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    setUploading(true);
    setFlash({ ok: '', err: '' });
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await api.post('/users/avatar', fd);
      setFlash({ ok: 'Profile photo updated.', err: '' });
      loadProfile();
      refresh();
    } catch (err) {
      setFlash({ ok: '', err: err.message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const requestRefund = async (orderId) => {
    const reason = (refundForm[orderId] || '').trim();
    setFlash({ ok: '', err: '' });
    try {
      await api.post(`/orders/${orderId}/refund`, { reason });
      setFlash({ ok: 'Refund request submitted. The farmer will review it.', err: '' });
      setRefundForm((f) => ({ ...f, [orderId]: '' }));
      api.get('/user/refunds').then((r) => setRefunds(r.data.data)).catch(() => {});
    } catch (err) {
      setFlash({ ok: '', err: err.message });
    }
  };

  const removeCartItem = async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      api.get('/cart').then((r) => setCart(r.data.data)).catch(() => {});
      loadProfile();
    } catch (err) { setFlash({ ok: '', err: err.message }); }
  };

  const removeWishItem = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      api.get('/wishlist').then((r) => setWishlist(r.data.data)).catch(() => {});
      loadProfile();
    } catch (err) { setFlash({ ok: '', err: err.message }); }
  };

  const selectConversation = (convId) => {
    setParams({ tab: 'chats', chat: convId });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = msg.trim();
    if (!text || !activeConv) return;
    setMsg('');
    try {
      await api.post(`/conversations/${activeConv}/messages`, { message: text });
      loadMessages(activeConv);
    } catch (err) {
      setFlash({ ok: '', err: err.message });
    }
  };

  if (!profile) return <div className="page-loader">Loading profile…</div>;
  const p = profile.user;
  const unreadTotal = (convs || []).reduce((s, c) => s + (c.unreadCount || 0), 0);

  return (
    <div>
      {flash.ok && <div className="alert alert-success">{flash.ok}</div>}
      {flash.err && <div className="alert alert-danger">{flash.err}</div>}

      <div className="profile-hero">
        <div className="profile-hero-inner">
          <div className="avatar-upload" title="Click to change photo" onClick={() => fileRef.current && fileRef.current.click()}>
            {p.avatar_url ? <img className="profile-avatar-lg" src={p.avatar_url} alt={p.username} /> : <span className="profile-avatar-lg profile-avatar-fallback"><CircleUser size={52} /></span>}
            <span className="avatar-upload-badge"><Camera size={14} /></span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => uploadAvatar(e.target.files[0])}
            />
          </div>
          <div className="profile-hero-info">
            <h2 className="profile-hero-name">
              {p.name || p.username}
              <span className={`badge ${p.role === 'farmer' ? 'success' : 'info'}`}>{roleLabel(p.role)}</span>
            </h2>
            <p className="profile-hero-sub">@{p.username} {p.email ? `· ${p.email}` : ''}</p>
            <div className="profile-hero-meta">
              {p.phone_number && <span><Phone size={13} /> {p.phone_number}</span>}
              {p.delivery_address && <span><MapPin size={13} /> {p.delivery_address}</span>}
              <span><CalendarDays size={13} /> Joined {fmtDate(p.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-chip"><span className="stat-num">{p.ordersCount}</span><span className="stat-label">Orders</span></div>
        <div className="stat-chip"><span className="stat-num">{p.cartCount}</span><span className="stat-label">Cart items</span></div>
        <div className="stat-chip"><span className="stat-num">{p.wishlistCount}</span><span className="stat-label">Wishlist</span></div>
      </div>

      {faStatus && p.role !== 'farmer' && (() => {
        const s = faStatus.isSeller
          ? { cls: 'ok', icon: Tractor, title: 'Farmer account active', body: 'Your seller account is live — manage products and sales from the farmer panel.', to: '/farmer', cta: 'Open farmer panel' }
          : faStatus.app?.status === 'pending'
            ? { cls: 'wait', icon: Clock, title: 'Farmer application under review', body: `Application #${faStatus.app.id} submitted ${fmtDate(faStatus.app.created_at)}. Our team is checking your documents.`, to: '/apply-farmer', cta: 'View application' }
            : faStatus.app?.status === 'approved'
              ? { cls: 'ok', icon: CheckCircle2, title: 'Farmer application approved', body: 'You can now sell on the marketplace.', to: '/farmer', cta: 'Open farmer panel' }
              : faStatus.app?.status === 'rejected'
                ? { cls: 'bad', icon: XCircle, title: 'Farmer application rejected', body: 'Contact support to find out how to proceed.', to: '/contact', cta: 'Contact support' }
                : { cls: 'cta', icon: Tractor, title: 'Sell your produce on AgriSmart', body: 'Become a farmer — upload your documents and start selling to buyers across Nepal.', to: '/apply-farmer', cta: 'Apply for Farmer' };
        const Icon = s.icon;
        return (
          <Link to={s.to} className={`fa-banner ${s.cls}`}>
            <span className="fa-banner-icon"><Icon size={19} /></span>
            <span className="fa-banner-body">
              <strong>{s.title}</strong>
              <span>{s.body}</span>
            </span>
            <span className="fa-banner-cta">{s.cta} <ArrowRight size={15} /></span>
          </Link>
        );
      })()}

      <div className="profile-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} type="button" className={`profile-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              <Icon size={16} />
              {t.key === 'chats' && unreadTotal > 0 ? `Chats (${unreadTotal})` : t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="profile-grid">
          <div className="card settings-card">
            <h3 className="settings-title"><User size={16} /> Personal Details</h3>

            <div className="settings-row settings-photo">
              <div className="settings-photo-left">
                <strong>Profile photo</strong>
                <p className="muted small" style={{ margin: 0 }}>Click the photo (or the button) to set a new one.</p>
              </div>
              <div className="settings-photo-right">
                {p.avatar_url
                  ? <img className="settings-avatar" src={p.avatar_url} alt="avatar" onClick={() => fileRef.current && fileRef.current.click()} title="Click to change" />
                  : <span className="settings-avatar settings-avatar-empty" onClick={() => fileRef.current && fileRef.current.click()}><CircleUser size={26} /></span>}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current && fileRef.current.click()}>
                  {uploading ? 'Uploading…' : 'Upload photo'}
                </button>
              </div>
            </div>

            {editing ? (
              <form onSubmit={saveProfile}>
                <div className="form-grid">
                  <div>
                    <label>Full name</label>
                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Your full name" />
                  </div>
                  <div>
                    <label>Username</label>
                    <input value={editForm.username ?? ''} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} placeholder="e.g. coolasf" />
                  </div>
                  <div>
                    <label>Email</label>
                    <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
                  </div>
                  <div>
                    <label>Phone number</label>
                    <input value={editForm.phoneNumber} onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} placeholder="98XXXXXXXX" />
                  </div>
                  <div className="form-grid-wide">
                    <label>Default delivery address</label>
                    <textarea value={editForm.deliveryAddress} onChange={(e) => setEditForm({ ...editForm, deliveryAddress: e.target.value })} rows={2} placeholder="District, Municipality, Tole" />
                  </div>
                </div>
                <div className="actions-inline mt-2">
                  <button className="btn btn-primary" type="submit"><Check size={15} /> Save Changes</button>
                  <button type="button" className="btn btn-ghost" onClick={() => { setEditing(false); setEditForm({ name: p.name || '', username: p.username || '', email: p.email || '', phoneNumber: p.phone_number || '', deliveryAddress: p.delivery_address || '' }); }}>
                    <X size={15} /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="settings-view">
                {[
                  ['Name', p.name || '—'],
                  ['Username', `@${p.username}`],
                  ['Email', p.email || '—'],
                  ['Phone', p.phone_number || '—'],
                  ['Delivery address', p.delivery_address || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="settings-row"><span className="muted small">{label}</span><span className="settings-value">{value}</span></div>
                ))}
                <div className="actions-inline mt-2">
                  <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}><Pencil size={14} /> Edit Details</button>
                  <Link className="btn btn-ghost btn-sm" to="/change-password">Change Password</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <>
          <div className="card mb-2">
            <h3 className="settings-title"><Package size={16} /> Refund Requests</h3>
            {!refunds?.length && <p className="muted small">No refund requests yet.</p>}
            {refunds?.map((r) => (
              <div key={r.id} className="order-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p className="small" style={{ margin: 0 }}><strong>Order #{r.order_id}</strong> · Rs {Number(r.total_amount).toLocaleString()} · requested {fmtDate(r.created_at)}</p>
                  {r.reason && <p className="muted small" style={{ margin: 0 }}>Reason: {r.reason}</p>}
                </div>
                <span className={`badge ${r.status === 'pending' ? 'warning' : r.status === 'approved' ? 'success' : 'danger'}`}>{r.status}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="settings-title"><Package size={16} /> Past Orders &amp; Delivery</h3>
            {!orders?.length && <p className="muted small">No orders yet. <Link to="/marketplace">Browse the marketplace</Link>.</p>}
            {orders?.map((o) => (
              <div key={o.id} className="order-card">
                <div className="order-card-head">
                  <div>
                    <Link to={`/order/${o.id}`}><strong>Order #{o.id}</strong></Link>
                    <span className="muted small"> · {fmtDate(o.order_date)} · {o.payment_method} ({o.payment_status})</span>
                  </div>
                  <span className={`badge ${STATUS_CLASS[o.status] || 'info'}`}>{o.status.replace(/_/g, ' ')}</span>
                </div>
                <p className="small" style={{ margin: '4px 0' }}>{o.items_preview}</p>
                <p className="muted small" style={{ margin: '2px 0' }}>
                  <MapPin size={12} style={{ verticalAlign: 'middle' }} /> {o.customer_name} · {o.delivery_address}
                  {o.estimated_delivery_date ? ` · ETA ${fmtDate(o.estimated_delivery_date)}` : ''}
                </p>
                <div className="order-card-foot">
                  <span className="order-total">Rs {Number(o.total_amount).toLocaleString()}</span>
                  <div className="actions-inline">
                    <Link to={`/order/${o.id}`} className="btn btn-ghost btn-sm">Details</Link>
                    <Link to={`/track-order/${o.id}`} className="btn btn-ghost btn-sm">Track</Link>
                    {(o.status === 'delivered' || o.status === 'cancelled') && (
                      <>
                        <input
                          placeholder="Refund reason (optional)"
                          value={refundForm[o.id] || ''}
                          onChange={(e) => setRefundForm({ ...refundForm, [o.id]: e.target.value })}
                          style={{ maxWidth: 220 }}
                        />
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => requestRefund(o.id)}>Request Refund</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'cart' && (
        <div className="card">
          <h3 className="settings-title"><ShoppingCart size={16} /> My Cart {cart ? `· Rs ${Number(cart.total).toLocaleString()}` : ''}</h3>
          {!cart?.items?.length && <p className="muted small">Your cart is empty. <Link to="/marketplace">Browse products</Link>.</p>}
          {cart?.items?.map((it) => (
            <div key={it.id} className="cart-row">
              {it.image_url ? <img className="cart-thumb" src={it.image_url} alt="" /> : <span className="cart-thumb cart-thumb-empty">🥕</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/product/${it.product_id}`}><strong>{it.product_name}</strong></Link>
                <p className="muted small" style={{ margin: 0 }}>
                  {it.quantity} × Rs {Number(it.price).toLocaleString()}{it.unit ? ` / ${it.unit}` : ''}
                </p>
              </div>
              <span className="order-total">Rs {Number(it.total).toLocaleString()}</span>
              <button className="btn btn-danger btn-sm" onClick={() => removeCartItem(it.id)}>Remove</button>
            </div>
          ))}
          {cart?.items?.length > 0 && (
            <div className="cart-footer">
              <div>
                <span className="muted small">Subtotal Rs {Number(cart.subtotal).toLocaleString()} + tax Rs {Number(cart.tax).toLocaleString()}</span>
              </div>
              <Link to="/cart" className="btn btn-primary">Proceed to Checkout <ShoppingCart size={15} /></Link>
            </div>
          )}
        </div>
      )}

      {tab === 'wishlist' && (
        <div className="card">
          <h3 className="settings-title"><Heart size={16} /> My Wishlist</h3>
          {!wishlist?.length && <p className="muted small">Nothing saved yet. <Link to="/marketplace">Browse products</Link>.</p>}
          {wishlist?.map((w) => (
            <div key={w.product_id} className="cart-row">
              {w.image_url ? <img className="cart-thumb" src={w.image_url} alt="" /> : <span className="cart-thumb cart-thumb-empty">🌾</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/product/${w.product_id}`}><strong>{w.product_name}</strong></Link>
                <p className="muted small" style={{ margin: 0 }}>
                  Rs {Number(w.price).toLocaleString()}{w.unit ? ` / ${w.unit}` : ''}
                  {Number(w.quantity_available) > 0 ? '' : <span className="badge danger">out of stock</span>}
                </p>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => removeWishItem(w.product_id)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'chats' && (
        <div className="chat-layout">
          <div className="chat-list card" style={{ padding: 0 }}>
            <h3 className="chat-list-title">Chats <MessageCircle size={14} /></h3>
            {!convs?.length && <p className="muted small" style={{ padding: 12 }}>No conversations yet. Open any product and tap the farmer to start chatting.</p>}
            {convs?.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chat-item ${activeConv === c.id ? 'active' : ''}`}
                onClick={() => selectConversation(c.id)}
              >
                {c.otherUser.avatar_url ? <img className="chat-avatar" src={c.otherUser.avatar_url} alt="" /> : <CircleUser className="chat-avatar" size={36} />}
                <span className="chat-item-body">
                  <span className="chat-item-name">
                    <strong>{c.otherUser.name || c.otherUser.username}</strong>
                    <RoleChip role={c.otherUser.role} />
                    <span className={`online-dot ${c.otherUser.online ? 'on' : ''}`} />
                  </span>
                  <span className="muted small chat-item-last">
                    {c.lastMessage ? (c.lastMessage.senderId === profile.user.id ? 'You: ' : '') + c.lastMessage.text : 'Say hello 👋'}
                  </span>
                </span>
                <span className="chat-item-meta">
                  {c.lastMessage && <span className="muted small">{fmtClock(c.lastMessage.createdAt)}</span>}
                  {c.unreadCount > 0 && <span className="unread-badge">{c.unreadCount}</span>}
                </span>
              </button>
            ))}
          </div>

          <div className="chat-thread card" style={{ padding: 0 }}>
            {!activeConv && <div className="chat-empty">Select a conversation to start chatting.</div>}
            {activeConv && !messages && <div className="chat-empty">Loading messages…</div>}
            {activeConv && messages && (
              <>
                <div className="chat-thread-head">
                  {otherStatus?.avatar_url ? <img className="chat-avatar" src={otherStatus.avatar_url} alt="" /> : <CircleUser className="chat-avatar" size={32} />}
                  <div>
                    <strong>{otherStatus?.name || otherStatus?.username} <RoleChip role={otherStatus?.role} /></strong>
                    <p className={`small ${otherStatus?.online ? 'text-success' : 'muted'}`} style={{ margin: 0 }}>{lastSeenText(otherStatus)}</p>
                  </div>
                  {otherStatus?.phone_number && (
                    <a className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} href={`tel:${otherStatus.phone_number}`}>📞 Call</a>
                  )}
                </div>
                <div className="chat-messages" ref={threadRef}>
                  {messages.map((m) => {
                    const mine = m.sender_id === profile.user.id;
                    const senderRole = mine ? p.role : otherStatus?.role;
                    return (
                      <div key={m.id} className={`chat-msg ${mine ? 'mine' : 'theirs'}`}>
                        <span>{m.message_text}</span>
                        <em className="chat-time">
                          <RoleChip role={senderRole} />
                          {fmtClock(m.created_at)}
                        </em>
                      </div>
                    );
                  })}
                  {!messages.length && <p className="muted text-center">No messages yet — say hello!</p>}
                </div>
                <form className="chat-input" onSubmit={sendMessage}>
                  <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message…" autoFocus />
                  <button className="btn btn-primary" type="submit">Send</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}