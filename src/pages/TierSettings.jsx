import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SHOP = 'checkout-store-q29whnkf.myshopify.com';

/* ── Tier visual config ───────────────────────────────────────── */
const TIER_CONFIG = {
  silver: {
    label: 'Silver',
    icon: '🥈',
    gradient: 'linear-gradient(135deg, #4a5568 0%, #718096 45%, #a0aec0 100%)',
    accent: '#e2e8f0',
    glow: 'rgba(160,174,192,0.4)',
    ring: '#a0aec0',
    textDark: false,
  },
  gold: {
    label: 'Gold',
    icon: '🥇',
    gradient: 'linear-gradient(135deg, #3d1e00 0%, #8b5e00 40%, #c9890a 70%, #e8b84b 100%)',
    accent: '#ffd700',
    glow: 'rgba(232,184,75,0.45)',
    ring: '#f5c518',
    textDark: false,
  },
  platinum: {
    label: 'Platinum',
    icon: '💎',
    gradient: 'linear-gradient(135deg, #0d0d1f 0%, #1a1040 40%, #2d1b69 70%, #4a1e8a 100%)',
    accent: '#ce93d8',
    glow: 'rgba(178,102,255,0.45)',
    ring: '#9c27b0',
    textDark: false,
  },
};

/* ── Single tier card ─────────────────────────────────────────── */
const TierCard = ({ tier, data, onSave, saving, canUpdate }) => {
  const cfg = TIER_CONFIG[tier];
  const [local, setLocal] = useState(data);
  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setLocal(data); }, [data]);

  const update = (field, value) => {
    setLocal(l => ({ ...l, [field]: value }));
    setDirty(true);
  };

  const updateBenefit = (i, value) => {
    const arr = [...(local.additionReward || [])];
    arr[i] = value;
    update('additionReward', arr);
  };
  const addBenefit = () => update('additionReward', [...(local.additionReward || []), '']);
  const removeBenefit = (i) => update('additionReward', (local.additionReward || []).filter((_, idx) => idx !== i));

  const handleSave = async () => {
    // Remove empty benefits before saving
    const cleaned = { ...local, additionReward: (local.additionReward || []).filter(b => b.trim()) };
    await onSave(tier, cleaned);
    setDirty(false);
    setEditMode(false);
  };

  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: `0 4px 6px rgba(0,0,0,0.07), 0 20px 40px ${cfg.glow}`,
      border: `1px solid ${cfg.ring}30`,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 12px rgba(0,0,0,0.1), 0 30px 60px ${cfg.glow}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 6px rgba(0,0,0,0.07), 0 20px 40px ${cfg.glow}`; }}
    >
      {/* Gradient header */}
      <div style={{ background: cfg.gradient, padding: '28px 28px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative rings */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', border: `1px solid ${cfg.accent}20`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', border: `1px solid ${cfg.accent}15`, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48,
              background: `${cfg.accent}20`,
              border: `1.5px solid ${cfg.accent}40`,
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
              backdropFilter: 'blur(10px)',
            }}>{cfg.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: `${cfg.accent}aa`, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 600 }}>Loyalty Sarkar</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: cfg.accent, letterSpacing: 1 }}>{cfg.label}</div>
            </div>
          </div>
          {/* Reward badge */}
          <div style={{
            background: `${cfg.accent}18`,
            border: `1px solid ${cfg.accent}35`,
            borderRadius: 10,
            padding: '6px 14px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: `${cfg.accent}90`, letterSpacing: 1 }}>REWARD</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: cfg.accent, lineHeight: 1.2 }}>{local.reward || '—'}</div>
          </div>
        </div>

        {/* Threshold */}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.accent }} />
          <span style={{ fontSize: 12, color: `${cfg.accent}cc` }}>
            Min. spend threshold:&nbsp;
            <strong style={{ color: cfg.accent }}>
              {tier === 'silver' ? 'Open to all' : `₹${(local.orderValue || 0).toLocaleString('en-IN')}`}
            </strong>
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: 'white', padding: '20px 24px' }}>
        {!editMode ? (
          /* ── Read view ── */
          <div>
            {/* Benefits preview */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Benefits</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {(local.additionReward || []).map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#1a1a1a' }}>
                    <span style={{ color: cfg.ring, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                    {b}
                  </div>
                ))}
              </div>
            </div>
            {canUpdate && (
              <button onClick={() => setEditMode(true)} style={{
                width: '100%', padding: '10px', borderRadius: 8,
                background: cfg.gradient, color: 'white', border: 'none',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                letterSpacing: 0.5,
              }}>
                Edit {cfg.label} Tier
              </button>
            )}
            {!canUpdate && (
              <div style={{ width: '100%', padding: '10px', borderRadius: 8, background: '#f1f5f9', color: '#9ca3af', border: '1px solid #e5e7eb', fontWeight: 600, fontSize: 13, textAlign: 'center' }}>
                🔒 View Only
              </div>
            )}
          </div>
        ) : (
          /* ── Edit view ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  Min. Order Value (₹)
                </label>
                <input className="form-input" type="number" value={local.orderValue ?? 0}
                  onChange={e => update('orderValue', parseInt(e.target.value) || 0)}
                  disabled={tier === 'silver'} style={{ opacity: tier === 'silver' ? 0.5 : 1 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  Reward %
                </label>
                <input className="form-input" type="text" placeholder="e.g. 15%" value={local.reward ?? ''}
                  onChange={e => update('reward', e.target.value)} />
              </div>
            </div>

            {/* Benefits editor */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                Benefits
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {(local.additionReward || []).map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6 }}>
                    <input className="form-input" value={b} placeholder={`Benefit ${i + 1}`}
                      onChange={e => updateBenefit(i, e.target.value)}
                      style={{ fontSize: 13 }}
                    />
                    <button onClick={() => removeBenefit(i)} style={{
                      background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 7,
                      width: 34, cursor: 'pointer', fontWeight: 700, fontSize: 16, flexShrink: 0,
                    }}>×</button>
                  </div>
                ))}
                <button onClick={addBenefit} style={{
                  background: '#f0f2f5', border: '1px dashed #c9d0d8',
                  borderRadius: 7, padding: '8px', color: '#697386',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                  + Add Benefit
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave} disabled={saving || !dirty}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  background: dirty ? cfg.gradient : '#e2e8f0',
                  color: dirty ? 'white' : '#697386',
                  border: 'none', fontWeight: 700, fontSize: 13,
                  cursor: dirty ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
                }}>
                {saving ? 'Saving…' : '✓ Save'}
              </button>
              <button onClick={() => { setLocal(data); setEditMode(false); setDirty(false); }}
                style={{
                  padding: '10px 16px', borderRadius: 8,
                  background: 'white', border: '1px solid #e3e8ef',
                  color: '#697386', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main ─────────────────────────────────────────────────────── */
export default function TierSettings() {
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission('tier_settings', 'update');

  const [tierInfo, setTierInfo] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState('');

  useEffect(() => {
    axios.get(`/api/tier-info/${SHOP}`)
      .then(r => setTierInfo(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (tier, updatedData) => {
    setSaving(true);
    try {
      const payload = { shopName: SHOP, ...tierInfo, [tier]: updatedData };
      const { data } = await axios.post('/api/tier-info', payload);
      setTierInfo(data.data);
      setToast(`${TIER_CONFIG[tier].label} tier saved successfully!`);
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Failed to save. Try again.');
      setTimeout(() => setToast(''), 3000);
    }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12, color: '#697386' }}>
      <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, borderColor: '#e3e8ef', borderTopColor: 'var(--primary)' }} />
      Loading tier settings…
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Tier Settings</h1>
          <p className="page-subtitle">Configure loyalty tier thresholds, rewards, and benefits</p>
        </div>
        <div style={{ fontSize: 12, color: '#697386', background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px' }}>
          🛍️ {SHOP}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          background: '#1a1a1a', color: 'white', borderRadius: 10,
          padding: '12px 20px', fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.3s ease',
        }}>
          ✓ {toast}
        </div>
      )}

      {tierInfo && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {['silver', 'gold', 'platinum'].map(tier => (
            <TierCard
              key={tier}
              tier={tier}
              data={tierInfo[tier] || {}}
              onSave={handleSave}
              saving={saving}
              canUpdate={canUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
