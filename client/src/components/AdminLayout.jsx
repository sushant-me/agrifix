import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, Users, ShoppingBag, Package, Newspaper, BrainCircuit,
  Tractor, MessagesSquare, ScrollText, Sprout, LogOut, ArrowLeft, CircleUser,
  CircleCheck, Timer, FolderOpen, IndianRupee, ClipboardList, FileCheck, Truck, ClipboardCheck,
} from 'lucide-react';

const NAV = [
  ['/farmer', LayoutDashboard, 'Overview'],
  ['/farmer/products', ShoppingBag, 'My Products'],
  ['/farmer/sales', Package, 'My Sales'],
  ['/farmer/orders-current', Truck, 'Current Orders'],
  ['/farmer/orders-results', ClipboardCheck, 'Order Results'],
  ['/farmer/farm', Tractor, 'Farm Records'],
  ['/farmer/news', Newspaper, 'News'],
  ['/farmer/support', MessagesSquare, 'Community Q&A'],
];

const SUPER_NAV = [
  ['/super-admin/users', Users, 'Users & Roles'],
  ['/super-admin/orders', ClipboardList, 'All Orders'],
  ['/super-admin/applications', FileCheck, 'Farmer Applications'],
  ['/super-admin/ml', BrainCircuit, 'ML Models'],
  ['/super-admin/activity', ScrollText, 'Activity Log'],
];

const STAT_ICONS = {
  'Total Users': Users,
  'Active Users': CircleCheck,
  'Products': ShoppingBag,
  'Orders': Package,
  'Pending Orders': Timer,
  'News': Newspaper,
  'ML Datasets': FolderOpen,
  'ML Models': BrainCircuit,
  'Revenue (₹)': IndianRupee,
};

export default function AdminLayout({ portal = 'farmer' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    document.body.classList.add('admin-theme');
    return () => document.body.classList.remove('admin-theme');
  }, []);

  const isSuper = portal === 'super';
  const SUPER_NAV_MAIN = [['/super-admin', LayoutDashboard, 'Overview'], ...SUPER_NAV];
  const navItems = isSuper ? SUPER_NAV_MAIN : NAV;

  const pageTitle = navItems
    .find(([to]) => pathname === to || (to !== '/super-admin' && to !== '/farmer' && pathname.startsWith(to)));
  const title = pageTitle ? pageTitle[2] : isSuper ? 'Super Admin' : 'Farmer Panel';

  const handleLogout = async () => {
    await logout();
    navigate('/login?tab=farmer');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-icon"><Sprout size={18} /></span>
          <span>AgriSmart</span>
        </div>
        <div className="admin-nav">
          {isSuper ? (
            <>
              <NavLink
                to="/super-admin"
                end
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={17} />
                Overview
              </NavLink>
              <div className="admin-nav-sep">Super Admin</div>
              {SUPER_NAV.map(([to, Icon, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </>
          ) : (
            NAV.map(([to, Icon, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/farmer'}
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))
          )}
        </div>
        <div className="admin-sidebar-footer">
          {isSuper ? <span className="badge danger">super admin</span> : <span className="badge success">farmer</span>}
          <div className="small" style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CircleUser size={15} /> {user?.username}
          </div>
          <Link to="/user-profile" className="btn-ghost btn-sm btn-block" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <CircleUser size={15} /> My Profile
          </Link>
          <Link to="/" className="btn-ghost btn-sm btn-block" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <ArrowLeft size={15} /> Back to site
          </Link>
          <button className="btn-ghost btn-sm btn-block" style={{ color: 'var(--danger)', borderColor: 'rgba(220,38,38,.3)', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }} onClick={handleLogout}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <h1 className="admin-title">{title}</h1>
          {user && <span className="muted small">Signed in as <strong>{user.username}</strong></span>}
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export { STAT_ICONS };