import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard',       icon: '📊', label: 'Dashboard',       permission: 'dashboard' },
  { to: '/transactions',    icon: '🧾', label: 'Transactions',     permission: 'transactions' },
  { to: '/analytics',       icon: '📈', label: 'Analytics',        permission: 'analytics' },
  { to: '/customers',       icon: '👥', label: 'Customers',        permission: 'customers' },
  { to: '/tier-settings',   icon: '⚙️', label: 'Tier Settings',    permission: 'tier_settings' },
  { to: '/role-management', icon: '🔑', label: 'Role Management',  permission: 'role_management' },
  { to: '/referral-stats',  icon: '🎁', label: 'Referrals',  permission: 'referral_stats' },
];

const SUPER_ADMIN_NAV = [
  { to: '/join-loyalty',      icon: '🎯', label: 'Join Loyalty' },
  { to: '/scan-scanner',      icon: '📷', label: 'Scan Scanner' },
  { to: '/referral',          icon: '🎁', label: 'Referral' },
  { to: '/general-settings',  icon: '⚙️', label: 'General Settings' },
];

const ROLE_META = {
  super_admin: { label: 'Super Admin', color: '#7c3aed', bg: '#ede9fe' },
  admin:       { label: 'Admin',       color: '#008060', bg: '#effaf6' },
};

export default function Sidebar() {
  const { user, logout, hasPermission } = useAuth();

  const roleMeta  = ROLE_META[user?.role] || { label: user?.roleName || 'Admin', color: '#697386', bg: '#f1f5f9' };
  const visibleNav = NAV_ITEMS.filter(item => !item.permission || hasPermission(item.permission));

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Brand */}
      <div className="sidebar-logo">
        <div className="brand">
          <div className="brand-icon">🏆</div>
          <div>
            <div className="brand-name">Loyalty Sarkar</div>
            <div className="brand-sub">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" style={{ flex: 1 }}>
        <div className="nav-section-label">Navigation</div>
        {visibleNav.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* Super admin exclusive pages */}
        {user?.role === 'super_admin' && (
          <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>Super Admin</div>
            {SUPER_ADMIN_NAV.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User card + logout */}
      <div style={{ margin: '0 12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#008060,#008060)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>
            {(user?.firstName || user?.name || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Admin'}
            </div>
            <div style={{ marginTop: 3 }}>
              <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 20, background: roleMeta.bg, color: roleMeta.color, fontSize: 10, fontWeight: 700 }}>
                {user?.roleName || roleMeta.label}
              </span>
            </div>
          </div>
        </div>

        <button onClick={logout}
          style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.15s, background 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'transparent'; }}>
          <span style={{ fontSize: 15 }}>🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
