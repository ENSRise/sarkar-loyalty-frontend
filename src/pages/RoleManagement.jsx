import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/* ─── Permission schema ──────────────────────────────────────────────── */
const PAGES = [
  { page: 'dashboard',        label: 'Dashboard',     icon: '📊', color: '#008060', actions: [{ key: 'read',   label: 'View' }] },
  { page: 'transactions',     label: 'Transactions',  icon: '🧾', color: '#0891b2', actions: [{ key: 'read',   label: 'View' }, { key: 'export', label: 'Export' }] },
  { page: 'analytics',        label: 'Analytics',     icon: '📈', color: '#7c3aed', actions: [{ key: 'read',   label: 'View' }] },
  { page: 'customers',        label: 'Customers',     icon: '👥', color: '#059669', actions: [{ key: 'read',   label: 'View' }, { key: 'export', label: 'Export' }] },
  { page: 'tier_settings',    label: 'Tier Settings', icon: '⚙️', color: '#d97706', actions: [{ key: 'read',   label: 'View' }, { key: 'update', label: 'Edit' }] },
  { page: 'referral_stats',   label: 'Referrals',        icon: '🎁', color: '#16a34a', actions: [{ key: 'read',   label: 'View' }] },
  { page: 'general_settings', label: 'General Settings',  icon: '⚙️', color: '#6366f1', actions: [{ key: 'read',   label: 'View' }, { key: 'update', label: 'Edit' }] },
];

const SUPER_ADMIN_EXTRAS = [
  { label: 'Role Management', icon: '🔑' },
  { label: 'Scan Loyalty',    icon: '📷' },
  { label: 'Join Loyalty',    icon: '🎯' },
];

const DEFAULT_PERMS = () => Object.fromEntries(PAGES.map(p => [p.page, Object.fromEntries(p.actions.map(a => [a.key, false]))]));

/* ─── Helpers ────────────────────────────────────────────────────────── */
const purple = '#008060';

function countGranted(perms) {
  if (!perms) return 0;
  return Object.values(perms).reduce((sum, actions) => sum + Object.values(actions).filter(Boolean).length, 0);
}

function totalActions() {
  return PAGES.reduce((s, p) => s + p.actions.length, 0);
}

/* ─── Small reusable UI ──────────────────────────────────────────────── */
function Avatar({ firstName, lastName }) {
  const name     = [firstName, lastName].filter(Boolean).join(' ') || '?';
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hue      = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${hue},55%,50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: active ? '#dcfce7' : '#fee2e2', color: active ? '#16a34a' : '#dc2626', fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function Chip({ label, color = '#008060' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: `${color}18`, color, fontSize: 11, fontWeight: 600 }}>
      {label}
    </span>
  );
}

function Btn({ onClick, children, variant = 'outline', size = 'sm', disabled, style: extra }) {
  const base = {
    border: 'none', borderRadius: 8, fontFamily: 'inherit', cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
    opacity: disabled ? 0.5 : 1,
    padding: size === 'sm' ? '6px 14px' : '10px 20px', fontSize: size === 'sm' ? 13 : 14,
    ...(variant === 'primary' ? { background: `linear-gradient(135deg,${purple},#006e52)`, color: 'white', boxShadow: '0 4px 12px rgba(0,128,96,0.3)' } : {}),
    ...(variant === 'outline' ? { background: 'white', color: '#374151', border: '1.5px solid #e5e7eb' } : {}),
    ...(variant === 'danger'  ? { background: '#fff5f5', color: '#dc2626', border: '1.5px solid #fee2e2' } : {}),
    ...extra,
  };
  return <button onClick={onClick} disabled={disabled} style={base}>{children}</button>;
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', autoFocus, prefix, disabled }) {
  return (
    <div style={{ position: 'relative' }}>
      {prefix && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{prefix}</span>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoFocus={autoFocus} disabled={disabled}
        style={{
          width: '100%', padding: `11px 12px 11px ${prefix ? '44px' : '12px'}`,
          border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 14,
          fontFamily: 'inherit', color: '#0f172a', outline: 'none',
          background: disabled ? '#f8fafc' : 'white',
          transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box',
        }}
        onFocus={e => { if (!disabled) { e.target.style.borderColor = purple; e.target.style.boxShadow = '0 0 0 3px rgba(0,128,96,0.15)'; } }}
        onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

function PwInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '11px 40px 11px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', color: '#0f172a', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}
        onFocus={e => { e.target.style.borderColor = purple; e.target.style.boxShadow = '0 0 0 3px rgba(0,128,96,0.15)'; }}
        onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
      />
      <button type="button" onClick={() => setShow(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15, padding: 0 }}>
        {show ? '🙈' : '👁'}
      </button>
    </div>
  );
}

function SelectInput({ value, onChange, options, disabled }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
      style={{ width: '100%', padding: '11px 36px 11px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', color: '#0f172a', outline: 'none', background: disabled ? '#f8fafc' : 'white', cursor: disabled ? 'default' : 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239ca3af' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', transition: 'border-color 0.15s, box-shadow 0.15s' }}
      onFocus={e => { if (!disabled) { e.target.style.borderColor = purple; e.target.style.boxShadow = '0 0 0 3px rgba(0,128,96,0.15)'; } }}
      onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}>
      {options.map(o => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
    </select>
  );
}

/* ─── Permission Matrix (shared between Role modal & role detail) ─────── */
function PermissionMatrix({ permissions, onChange, readonly }) {
  const toggle = (page, action) => {
    if (readonly) return;
    const updated = { ...permissions, [page]: { ...permissions[page], [action]: !permissions[page]?.[action] } };
    onChange(updated);
  };

  return (
    <div style={{ border: '1px solid #f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 }}>Page</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 }}>Permissions</span>
      </div>

      {PAGES.map((p, i) => (
        <div key={p.page} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < PAGES.length - 1 ? '1px solid #f8fafc' : 'none', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${p.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{p.icon}</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{p.label}</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {p.actions.map(a => {
              const checked = !!(permissions?.[p.page]?.[a.key]);
              return (
                <label key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: readonly ? 'default' : 'pointer', userSelect: 'none' }}>
                  <div onClick={() => toggle(p.page, a.key)}
                    style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? purple : '#d1d5db'}`, background: checked ? purple : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0, cursor: readonly ? 'default' : 'pointer' }}>
                    {checked && <span style={{ color: 'white', fontSize: 11, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: checked ? '#374151' : '#9ca3af' }}>{a.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {/* Super admin extra info row */}
      <div style={{ padding: '10px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>🔒</span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>Role Management, Scan Loyalty, Join Loyalty — exclusive to Super Admin only</span>
      </div>
    </div>
  );
}

/* ─── Role modal (create / edit) ─────────────────────────────────────── */
function RoleModal({ role, onClose, onSaved }) {
  const isEdit = !!role;
  const [name,    setName]    = useState(role?.name        || '');
  const [desc,    setDesc]    = useState(role?.description || '');
  const [perms,   setPerms]   = useState(() => {
    if (role?.permissions) return role.permissions;
    return DEFAULT_PERMS();
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [apiErr,  setApiErr]  = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = 'Role name is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setApiErr('');
    try {
      if (isEdit) {
        await axios.patch(`/api/admin/roles/${role.id}`, { name, description: desc, permissions: perms });
      } else {
        await axios.post('/api/admin/roles', { name, description: desc, permissions: perms });
      }
      onSaved();
    } catch (err) {
      setApiErr(err.response?.data?.error || 'Something went wrong.');
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>{isEdit ? 'Edit Role' : 'Create New Role'}</h3>
            <p style={{ fontSize: 13, color: '#697386', margin: '3px 0 0' }}>
              {isEdit ? 'Update role permissions' : 'Define what this role can access and do'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Body */}
        <form onSubmit={submit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            {apiErr && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, display: 'flex', gap: 8 }}>
                <span>⚠️</span>{apiErr}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Role Name *" error={errors.name}>
                <TextInput value={name} onChange={setName} placeholder="e.g. Senior Manager" autoFocus disabled={isEdit && role?.isBuiltIn} />
              </FormField>
              <FormField label="Description">
                <TextInput value={desc} onChange={setDesc} placeholder="Optional description" />
              </FormField>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Permissions</label>
              <PermissionMatrix permissions={perms} onChange={setPerms} readonly={false} />
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
            <Btn onClick={onClose} variant="outline">Cancel</Btn>
            <button type="submit" disabled={loading}
              style={{ padding: '10px 24px', border: 'none', borderRadius: 9, background: loading ? '#a7f3d0' : `linear-gradient(135deg,${purple},#006e52)`, color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />Saving…</> : (isEdit ? 'Save Changes' : 'Create Role')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Role detail drawer ─────────────────────────────────────────────── */
function RoleDetail({ role, onClose, onEdit, onDelete, isSuperAdmin }) {
  const granted = countGranted(role.permissions);
  const total   = totalActions();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>{role.name}</h3>
              {role.isBuiltIn && <Chip label="Built-in" color="#697386" />}
            </div>
            <p style={{ fontSize: 13, color: '#697386', margin: 0 }}>{role.description || 'No description'}</p>
            <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
              {granted}/{total} permissions granted · {role.userCount} user{role.userCount !== 1 ? 's' : ''} assigned
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <PermissionMatrix permissions={isSuperAdmin ? Object.fromEntries(PAGES.map(p => [p.page, Object.fromEntries(p.actions.map(a => [a.key, true]))])) : role.permissions} onChange={() => {}} readonly />
        </div>

        {!isSuperAdmin && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
            {!role.isBuiltIn && (
              <Btn onClick={onDelete} variant="danger">Delete Role</Btn>
            )}
            <Btn onClick={onEdit} variant="primary">Edit Permissions</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── User modal (create / edit) ─────────────────────────────────────── */
function UserModal({ user, roles, currentUser, onClose, onSaved }) {
  const isEdit = !!user;

  const initRole = () => {
    if (!user) return 'admin';
    return user.role;
  };
  const initRoleId = () => {
    if (!user) return roles[0]?.id?.toString() || '';
    return user.roleId?.toString() || '';
  };

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName,  setLastName]  = useState(user?.lastName  || '');
  const [phone,     setPhone]     = useState(user?.phone     || '');
  const [role,      setRole]      = useState(initRole);
  const [roleId,    setRoleId]    = useState(initRoleId);
  const [password,  setPassword]  = useState('');
  const [isActive,  setIsActive]  = useState(user?.isActive ?? true);
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState({});
  const [apiErr,    setApiErr]    = useState('');

  const validate = () => {
    const e = {};
    if (!firstName.trim())                   e.firstName = 'First name is required.';
    if (!phone.trim() || phone.length < 10)  e.phone     = 'Enter a valid 10-digit phone number.';
    if (!isEdit && !password)                e.password  = 'Password is required.';
    if (!isEdit && password && password.length < 6) e.password = 'Minimum 6 characters.';
    if (role === 'admin' && !roleId)         e.roleId    = 'Select a role for this user.';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setApiErr('');
    try {
      const payload = {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        phone:     phone.trim(),
        role,
        roleId:    role === 'admin' ? parseInt(roleId) : null,
        isActive,
      };
      if (!isEdit || password) payload.password = password;
      if (isEdit) {
        await axios.patch(`/api/admin/users/${user.id}`, payload);
      } else {
        await axios.post('/api/admin/users', payload);
      }
      onSaved();
    } catch (err) {
      setApiErr(err.response?.data?.error || err.response?.data?.message || 'Something went wrong.');
    }
    setLoading(false);
  };

  const isSelf = isEdit && user.id === currentUser?.id;
  const selectedRole = roles.find(r => r.id?.toString() === roleId);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>{isEdit ? 'Edit User' : 'Add New User'}</h3>
            <p style={{ fontSize: 13, color: '#697386', margin: '3px 0 0' }}>{isEdit ? 'Update user details and role' : 'Create an admin account and assign a role'}</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <form onSubmit={submit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {apiErr && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, display: 'flex', gap: 8 }}>
                <span>⚠️</span>{apiErr}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="First Name *" error={errors.firstName}>
                <TextInput value={firstName} onChange={setFirstName} placeholder="Ravi" autoFocus />
              </FormField>
              <FormField label="Last Name">
                <TextInput value={lastName} onChange={setLastName} placeholder="Sharma" />
              </FormField>
            </div>

            <FormField label="Phone Number *" error={errors.phone}>
              <TextInput value={phone} onChange={v => setPhone(v.replace(/\D/g, '').slice(0, 10))} placeholder="9999999999" prefix="+91" />
            </FormField>

            <FormField label={isEdit ? 'New Password (leave blank to keep)' : 'Password *'} error={errors.password}>
              <PwInput value={password} onChange={setPassword} placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 6 characters'} />
            </FormField>

            {/* Role selector */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Assign Role</label>

              {/* Super Admin option */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 10, border: `2px solid ${role === 'super_admin' ? purple : '#e5e7eb'}`, background: role === 'super_admin' ? '#effaf6' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
                <input type="radio" name="roleSelect" value="super_admin" checked={role === 'super_admin'} onChange={() => setRole('super_admin')}
                  style={{ accentColor: purple, marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    👑 Super Admin
                    <span style={{ fontSize: 10, background: '#ede9fe', color: '#7c3aed', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>Full Access</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#697386', marginTop: 3 }}>All pages + Role Management, Scan Loyalty, Join Loyalty</div>
                </div>
              </label>

              {/* Custom roles */}
              {roles.map(r => (
                <label key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 10, border: `2px solid ${role === 'admin' && roleId === r.id?.toString() ? purple : '#e5e7eb'}`, background: role === 'admin' && roleId === r.id?.toString() ? '#effaf6' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <input type="radio" name="roleSelect" value={r.id} checked={role === 'admin' && roleId === r.id?.toString()} onChange={() => { setRole('admin'); setRoleId(r.id.toString()); }}
                    style={{ accentColor: purple, marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                      🛡️ {r.name}
                      {r.isBuiltIn && <span style={{ fontSize: 10, background: '#f1f5f9', color: '#697386', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>Default</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#697386', marginTop: 3 }}>{r.description || 'Custom role'}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {PAGES.map(p => {
                        const anyGranted = p.actions.some(a => r.permissions?.[p.page]?.[a.key]);
                        if (!anyGranted) return null;
                        const labels = p.actions.filter(a => r.permissions?.[p.page]?.[a.key]).map(a => a.label).join('+');
                        return <Chip key={p.page} label={`${p.icon} ${p.label}: ${labels}`} color={p.color} />;
                      })}
                    </div>
                  </div>
                </label>
              ))}
              {errors.roleId && <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{errors.roleId}</p>}
            </div>

            {isEdit && (
              <FormField label="Status">
                <SelectInput value={isActive ? 'active' : 'inactive'} onChange={v => setIsActive(v === 'active')}
                  options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
                  disabled={isSelf}
                />
                {isSelf && <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>⚠️ You cannot deactivate your own account.</p>}
              </FormField>
            )}
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
            <Btn onClick={onClose} variant="outline">Cancel</Btn>
            <button type="submit" disabled={loading}
              style={{ padding: '10px 24px', border: 'none', borderRadius: 9, background: loading ? '#a7f3d0' : `linear-gradient(135deg,${purple},#006e52)`, color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />Saving…</> : (isEdit ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete confirm modal ───────────────────────────────────────────── */
function DeleteModal({ title, message, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const go = async () => {
    setLoading(true);
    try { await onConfirm(); } catch (e) { setErr(e.response?.data?.error || 'Could not delete.'); setLoading(false); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 380, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🗑️</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>{title}</h3>
        <p style={{ fontSize: 14, color: '#697386', lineHeight: 1.6, margin: '0 0 16px' }}>{message}</p>
        {err && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={onClose} variant="outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</Btn>
          <button onClick={go} disabled={loading}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 9, background: loading ? '#fca5a5' : '#ef4444', color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />Deleting…</> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Role card ──────────────────────────────────────────────────────── */
function RoleCard({ role, isSuperAdmin, onClick, onEdit, onDelete }) {
  const granted = isSuperAdmin ? totalActions() : countGranted(role.permissions);
  const total   = totalActions();
  const pct     = Math.round((granted / total) * 100);

  return (
    <div onClick={onClick}
      style={{ background: 'white', border: '1.5px solid #f1f5f9', borderRadius: 14, padding: '20px', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = purple; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,128,96,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = 'none'; }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>{isSuperAdmin ? '👑' : '🛡️'}</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{isSuperAdmin ? 'Super Admin' : role.name}</span>
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
            {isSuperAdmin ? 'Full access to all features' : (role.description || 'Custom role')}
          </p>
        </div>
        {!isSuperAdmin && (
          <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
            <button onClick={onEdit}
              style={{ padding: '4px 10px', border: '1.5px solid #e5e7eb', borderRadius: 7, background: 'white', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = purple; e.currentTarget.style.color = purple; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}>
              Edit
            </button>
            {!role.isBuiltIn && (
              <button onClick={onDelete}
                style={{ padding: '4px 10px', border: '1.5px solid #fee2e2', borderRadius: 7, background: '#fff5f5', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}>
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
          <span>{granted}/{total} permissions</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: '#f1f5f9' }}>
          <div style={{ height: '100%', borderRadius: 2, background: isSuperAdmin ? 'linear-gradient(90deg,#6d28d9,#7c3aed)' : `linear-gradient(90deg,${purple},#34d399)`, width: `${pct}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Permission chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {isSuperAdmin ? (
          [...PAGES, ...SUPER_ADMIN_EXTRAS.map(s => ({ page: s.label, label: s.label, icon: s.icon, color: '#7c3aed', actions: [] }))].map(p => (
            <Chip key={p.page} label={`${p.icon} ${p.label}`} color={p.color || '#7c3aed'} />
          ))
        ) : (
          PAGES.map(p => {
            const labels = p.actions.filter(a => role.permissions?.[p.page]?.[a.key]).map(a => a.label);
            if (!labels.length) return null;
            return <Chip key={p.page} label={`${p.icon} ${p.label}: ${labels.join('+')}`} color={p.color} />;
          })
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
        👥 {isSuperAdmin ? '—' : role.userCount} user{role.userCount !== 1 ? 's' : ''} assigned
        {role.isBuiltIn && <span style={{ marginLeft: 8, fontSize: 10, background: '#f1f5f9', color: '#9ca3af', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>BUILT-IN</span>}
      </div>
    </div>
  );
}

/* ─── Tab button ─────────────────────────────────────────────────────── */
function Tab({ label, active, onClick, count }) {
  return (
    <button onClick={onClick}
      style={{ padding: '10px 20px', border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: active ? 700 : 500, color: active ? purple : '#697386', cursor: 'pointer', borderBottom: `2px solid ${active ? purple : 'transparent'}`, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}>
      {label}
      <span style={{ padding: '1px 7px', borderRadius: 20, background: active ? '#effaf6' : '#f1f5f9', color: active ? purple : '#9ca3af', fontSize: 11, fontWeight: 700 }}>{count}</span>
    </button>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */
export default function RoleManagement() {
  const { user: currentUser } = useAuth();

  const [tab,       setTab]       = useState('roles');
  const [roles,     setRoles]     = useState([]);
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [roleFilter,setRoleFilter]= useState('all');

  // Modals
  const [modal, setModal] = useState(null);
  // null | 'addRole' | {type:'editRole',role} | {type:'viewRole',role,isSuperAdmin}
  //     | 'addUser' | {type:'editUser',user} | {type:'deleteUser',user} | {type:'deleteRole',role}

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, uRes] = await Promise.all([
        axios.get('/api/admin/roles'),
        axios.get('/api/admin/users'),
      ]);
      setRoles(rRes.data.data || []);
      setUsers(uRes.data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSaved  = () => { setModal(null); load(); };
  const closeModal = () => setModal(null);

  const filteredUsers = users.filter(u => {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ').toLowerCase();
    const q    = search.toLowerCase();
    const matchSearch = !q || name.includes(q) || u.phone?.includes(q);
    const matchRole   = roleFilter === 'all'
      ? true
      : roleFilter === 'super_admin'
        ? u.role === 'super_admin'
        : u.userRole?.name === roleFilter;
    return matchSearch && matchRole;
  });

  const roleFilterOptions = [
    { value: 'all',         label: 'All Roles' },
    { value: 'super_admin', label: 'Super Admin' },
    ...roles.map(r => ({ value: r.name, label: r.name })),
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh', background: '#f8fafc' }}>

      {/* Modals */}
      {modal === 'addRole' && <RoleModal onClose={closeModal} onSaved={onSaved} />}
      {modal?.type === 'editRole'   && <RoleModal role={modal.role} onClose={closeModal} onSaved={onSaved} />}
      {modal?.type === 'viewRole'   && (
        <RoleDetail role={modal.role} isSuperAdmin={modal.isSuperAdmin} onClose={closeModal}
          onEdit={() => setModal({ type: 'editRole', role: modal.role })}
          onDelete={() => setModal({ type: 'deleteRole', role: modal.role })} />
      )}
      {modal === 'addUser' && <UserModal roles={roles} currentUser={currentUser} onClose={closeModal} onSaved={onSaved} />}
      {modal?.type === 'editUser'   && <UserModal user={modal.user} roles={roles} currentUser={currentUser} onClose={closeModal} onSaved={onSaved} />}
      {modal?.type === 'deleteUser' && (
        <DeleteModal
          title="Delete User?"
          message={<>Are you sure you want to delete <strong>{[modal.user.firstName, modal.user.lastName].filter(Boolean).join(' ')}</strong>? This cannot be undone.</>}
          onClose={closeModal}
          onConfirm={async () => { await axios.delete(`/api/admin/users/${modal.user.id}`); onSaved(); }}
        />
      )}
      {modal?.type === 'deleteRole' && (
        <DeleteModal
          title="Delete Role?"
          message={<>Delete role <strong>{modal.role.name}</strong>? Users assigned this role must be reassigned first.</>}
          onClose={closeModal}
          onConfirm={async () => { await axios.delete(`/api/admin/roles/${modal.role.id}`); onSaved(); }}
        />
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.4px' }}>Role Management</h1>
          <p style={{ fontSize: 14, color: '#697386', margin: 0 }}>Create roles, define permissions, and manage admin users</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={() => setModal('addRole')} variant="outline" size="sm">+ New Role</Btn>
          <Btn onClick={() => setModal('addUser')} variant="primary" size="sm">+ Add User</Btn>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Roles',  value: roles.length + 1, icon: '🔑', bg: '#ede9fe', color: '#7c3aed' },
          { label: 'Total Users',  value: users.length,     icon: '👥', bg: '#effaf6', color: '#008060' },
          { label: 'Active Users', value: users.filter(u => u.isActive).length, icon: '✅', bg: '#dcfce7', color: '#16a34a' },
          { label: 'Super Admins', value: users.filter(u => u.role === 'super_admin').length, icon: '👑', bg: '#fef3c7', color: '#d97706' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: 11, color: '#697386', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '0 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 4 }}>
          <Tab label="Roles"  active={tab === 'roles'} onClick={() => setTab('roles')} count={roles.length + 1} />
          <Tab label="Users"  active={tab === 'users'} onClick={() => setTab('users')} count={users.length} />
        </div>

        {/* ── Roles tab ── */}
        {tab === 'roles' && (
          <div style={{ padding: 20 }}>
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderColor: '#e2e8f0', borderTopColor: purple, margin: '0 auto 12px' }} />
                <div style={{ fontSize: 13, color: '#697386' }}>Loading roles…</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {/* Super Admin card (always first) */}
                <RoleCard
                  role={{ name: 'Super Admin', description: 'Full access', permissions: {}, userCount: users.filter(u => u.role === 'super_admin').length, isBuiltIn: true }}
                  isSuperAdmin
                  onClick={() => setModal({ type: 'viewRole', role: { name: 'Super Admin', description: 'Full access to all features including Role Management, Scan Loyalty, and Join Loyalty', permissions: {}, userCount: users.filter(u => u.role === 'super_admin').length, isBuiltIn: true }, isSuperAdmin: true })}
                  onEdit={() => {}} onDelete={() => {}}
                />
                {roles.map(r => (
                  <RoleCard key={r.id} role={r}
                    onClick={() => setModal({ type: 'viewRole', role: r, isSuperAdmin: false })}
                    onEdit={e => { e?.stopPropagation?.(); setModal({ type: 'editRole', role: r }); }}
                    onDelete={e => { e?.stopPropagation?.(); setModal({ type: 'deleteRole', role: r }); }}
                  />
                ))}
                {/* Add role button card */}
                <button onClick={() => setModal('addRole')}
                  style={{ border: '2px dashed #e5e7eb', borderRadius: 14, padding: '32px 20px', cursor: 'pointer', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9ca3af', transition: 'all 0.15s', fontFamily: 'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = purple; e.currentTarget.style.color = purple; e.currentTarget.style.background = '#effaf6'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ fontSize: 28 }}>+</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Create New Role</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Users tab ── */}
        {tab === 'users' && (
          <>
            {/* Toolbar */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>🔍</span>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone…"
                  style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
              </div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                style={{ padding: '9px 32px 9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', color: '#374151', outline: 'none', background: 'white', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239ca3af' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                {roleFilterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {loading ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderColor: '#e2e8f0', borderTopColor: purple, margin: '0 auto 12px' }} />
                <div style={{ fontSize: 13, color: '#697386' }}>Loading users…</div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>No users found</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>{search ? 'Try a different search.' : 'Add your first admin user.'}</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['User', 'Phone', 'Role', 'Permissions', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '11px 16px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, idx) => {
                      const isSuperAdmin = u.role === 'super_admin';
                      const roleName     = isSuperAdmin ? 'Super Admin' : (u.userRole?.name || 'Unknown');
                      const granted      = isSuperAdmin ? totalActions() : countGranted(u.userRole?.permissions);
                      return (
                        <tr key={u.id} style={{ borderBottom: idx < filteredUsers.length - 1 ? '1px solid #f8fafc' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar firstName={u.firstName} lastName={u.lastName} />
                              <div>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                  {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                                  {u.id === currentUser?.id && <span style={{ marginLeft: 7, fontSize: 10, background: '#effaf6', color: purple, borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>You</span>}
                                </div>
                                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{u.email || 'No email'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#374151', fontFamily: 'monospace', fontSize: 13 }}>+91 {u.phone || '—'}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <Chip label={roleName} color={isSuperAdmin ? '#7c3aed' : purple} />
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontSize: 12, color: '#697386' }}>
                              <div style={{ width: 100, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
                                <div style={{ height: '100%', background: isSuperAdmin ? '#7c3aed' : purple, width: `${Math.round((granted / totalActions()) * 100)}%`, borderRadius: 2 }} />
                              </div>
                              {granted}/{totalActions()} granted
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}><StatusBadge active={u.isActive} /></td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button onClick={() => setModal({ type: 'editUser', user: u })}
                                style={{ padding: '5px 12px', border: '1.5px solid #e5e7eb', borderRadius: 7, background: 'white', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = purple; e.currentTarget.style.color = purple; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}>
                                Edit
                              </button>
                              {u.id !== currentUser?.id && (
                                <button onClick={() => setModal({ type: 'deleteUser', user: u })}
                                  style={{ padding: '5px 12px', border: '1.5px solid #fee2e2', borderRadius: 7, background: '#fff5f5', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                  onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}>
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredUsers.length > 0 && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#9ca3af' }}>
                Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
