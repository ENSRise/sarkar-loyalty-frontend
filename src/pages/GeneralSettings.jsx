import { useState, useEffect } from 'react';
import axios from 'axios';

const RESET_CYCLE_OPTIONS = [
  { value: '6months', label: '6 Months' },
  { value: '1year',   label: '1 Year' },
];

function SettingCard({ title, icon, children }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      marginBottom: 20,
    }}>
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#f6f6f7', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>{icon}</div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{title}</span>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5, letterSpacing: 0.3 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 13px', borderRadius: 8,
  border: '1px solid #d1d5db', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
  background: '#fff', color: '#1a1a1a',
  transition: 'border-color 0.15s',
};

export default function GeneralSettings() {
  const [form, setForm] = useState({
    shopName: '',
    accessToken: '',
    silverReferralPoint: '',
    goldReferralPoint: '',
    platinumReferralPoint: '',
    resetCycle: '6months',
  });
  const [accessTokenSet, setAccessTokenSet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showToken, setShowToken] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    axios.get('/api/settings')
      .then(({ data }) => {
        const s = data.data || {};
        setForm({
          shopName:             s.shopName             || '',
          accessToken:          '',
          silverReferralPoint:  s.silverReferralPoint  || '100',
          goldReferralPoint:    s.goldReferralPoint    || '150',
          platinumReferralPoint:s.platinumReferralPoint|| '200',
          resetCycle:           s.resetCycle           || '6months',
        });
        setAccessTokenSet(!!s.accessTokenSet);
      })
      .catch(() => showToast('Failed to load settings', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings', form);
      showToast('Settings saved successfully');
      if (form.accessToken) setAccessTokenSet(true);
      setForm(f => ({ ...f, accessToken: '' }));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#dc2626' : '#008060',
          color: 'white', padding: '12px 20px', borderRadius: 10,
          fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">General Settings</h1>
        <p className="page-subtitle">Configure your Shopify integration, referral rewards, and program reset cycle.</p>
      </div>

      {/* Shopify Integration */}
      <SettingCard title="Shopify Integration" icon="🛍️">
        <Field label="Shop Name" hint="Your myshopify.com store handle (e.g. loyalty-rgck8aw4.myshopify.com)">
          <input
            value={form.shopName}
            onChange={e => set('shopName', e.target.value)}
            placeholder="your-store.myshopify.com"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#008060'}
            onBlur={e => e.target.style.borderColor = '#d1d5db'}
          />
        </Field>

        <Field
          label={`Access Token${accessTokenSet ? ' (already set)' : ''}`}
          hint={accessTokenSet
            ? 'A token is already saved. Enter a new one only if you want to replace it.'
            : 'Shopify Admin API access token from your private app.'}
        >
          <div style={{ position: 'relative' }}>
            <input
              type={showToken ? 'text' : 'password'}
              value={form.accessToken}
              onChange={e => set('accessToken', e.target.value)}
              placeholder={accessTokenSet ? 'Leave blank to keep existing token' : 'shpat_xxxxxxxxxxxxxxxx'}
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={e => e.target.style.borderColor = '#008060'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
            <button
              type="button"
              onClick={() => setShowToken(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af', padding: 0 }}
            >
              {showToken ? '🙈' : '👁'}
            </button>
          </div>
          {accessTokenSet && (
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 10px' }}>
              <span style={{ color: '#16a34a', fontSize: 12 }}>●</span>
              <span style={{ color: '#15803d', fontSize: 12, fontWeight: 600 }}>Token is configured</span>
            </div>
          )}
        </Field>
      </SettingCard>

      {/* Referral Points */}
      <SettingCard title="Referral Reward Points" icon="🎁">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <Field label="Silver Points">
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="0"
                value={form.silverReferralPoint}
                onChange={e => set('silverReferralPoint', e.target.value)}
                placeholder="100"
                style={{ ...inputStyle, paddingLeft: 36 }}
                onFocus={e => e.target.style.borderColor = '#008060'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8' }}>pts</span>
            </div>
          </Field>
          <Field label="Gold Points">
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="0"
                value={form.goldReferralPoint}
                onChange={e => set('goldReferralPoint', e.target.value)}
                placeholder="150"
                style={{ ...inputStyle, paddingLeft: 36 }}
                onFocus={e => e.target.style.borderColor = '#008060'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8' }}>pts</span>
            </div>
          </Field>
          <Field label="Platinum Points">
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="0"
                value={form.platinumReferralPoint}
                onChange={e => set('platinumReferralPoint', e.target.value)}
                placeholder="200"
                style={{ ...inputStyle, paddingLeft: 36 }}
                onFocus={e => e.target.style.borderColor = '#008060'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8' }}>pts</span>
            </div>
          </Field>
        </div>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: -8 }}>
          Points awarded to the referrer when they successfully bring in a new customer at each tier level.
        </p>
      </SettingCard>

      {/* Program Settings */}
      <SettingCard title="Program Settings" icon="🔄">
        <Field label="Reset Cycle" hint="How often customer tier progress resets based on spend.">
          <div style={{ display: 'flex', gap: 12 }}>
            {RESET_CYCLE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('resetCycle', opt.value)}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10,
                  border: `2px solid ${form.resetCycle === opt.value ? '#008060' : '#e5e7eb'}`,
                  background: form.resetCycle === opt.value ? '#f0fdf4' : '#fff',
                  color: form.resetCycle === opt.value ? '#008060' : '#6b7280',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {form.resetCycle === opt.value && <span style={{ marginRight: 6 }}>✓</span>}
                {opt.label}
              </button>
            ))}
          </div>
        </Field>
      </SettingCard>

      {/* Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 40 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{ padding: '12px 32px', fontSize: 14, fontWeight: 700, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
