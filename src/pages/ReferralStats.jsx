import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/* ── Tier config ─────────────────────────────────────────────────── */
const TIER = {
  silver:   { bg: 'linear-gradient(135deg,#f1f3f5,#e2e8f0)', color: '#4a5568', border: '#d1d9e6', icon: '🥈' },
  gold:     { bg: 'linear-gradient(135deg,#fff8e1,#fef3c7)', color: '#78450a', border: '#fde68a', icon: '🥇' },
  platinum: { bg: 'linear-gradient(135deg,#f3e8ff,#ede9fe)', color: '#5b21b6', border: '#ddd6fe', icon: '💎' },
};

const TierBadge = ({ tier }) => {
  const t = TIER[tier?.toLowerCase()] || TIER.silver;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: t.bg, color: t.color, border: `1px solid ${t.border}`,
      borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
      whiteSpace: 'nowrap', textTransform: 'capitalize',
    }}>
      {t.icon} {tier}
    </span>
  );
};

/* ── Stat card ───────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, accent }) => (
  <div style={{
    background: 'white', border: '1px solid var(--border)', borderRadius: 12,
    padding: '20px 24px', flex: 1, minWidth: 160,
    borderLeft: `4px solid ${accent}`,
  }}>
    <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>{value}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{sub}</div>}
  </div>
);

/* ── Referred row (inside expand panel) ─────────────────────────── */
const ReferredRow = ({ item, idx }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '28px 1fr 140px 1fr',
    alignItems: 'center', gap: 12,
    padding: '9px 14px',
    background: idx % 2 === 0 ? '#fafafa' : 'white',
    borderBottom: '1px solid #f1f5f9',
    fontSize: 13,
  }}>
    <div style={{
      width: 24, height: 24, borderRadius: '50%',
      background: 'linear-gradient(135deg,#6366f1,#818cf8)',
      color: 'white', fontSize: 10, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {(item.name || '?').charAt(0).toUpperCase()}
    </div>

    <div>
      <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.name || '—'}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{item.phonenumber}</div>
    </div>

    <div style={{ fontSize: 11, color: '#64748b' }}>ID: {item.customer_id}</div>

    <div>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
        borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 700,
        fontFamily: 'monospace', letterSpacing: '0.5px',
      }}>
        🎫 {item.couponCode || '—'}
      </span>
    </div>
  </div>
);

/* ── Main referrer row ───────────────────────────────────────────── */
const ReferrerRow = ({ customer, expanded, onToggle }) => {
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—';
  const phone = customer.phone ? String(customer.phone).slice(-10) : '—';
  const parts = customer.customerReferralPart || [];

  return (
    <>
      <tr
        onClick={onToggle}
        style={{ cursor: 'pointer', transition: 'background 0.12s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={e => e.currentTarget.style.background = expanded ? '#f0fdf7' : 'white'}
        className={expanded ? 'expanded-row' : ''}
      >
        {/* Avatar + Name */}
        <td style={{ padding: '13px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#008060,#006e52)',
              color: 'white', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{customer.email || '—'}</div>
            </div>
          </div>
        </td>

        {/* Phone */}
        <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569', fontFamily: 'monospace' }}>
          {phone}
        </td>

        {/* Tier */}
        <td style={{ padding: '13px 16px' }}>
          <TierBadge tier={customer.currentTier} />
        </td>

        {/* Referral count */}
        <td style={{ padding: '13px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg,#008060,#006e52)',
              color: 'white', fontSize: 13, fontWeight: 800,
            }}>
              {customer.referralCount}
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>referral{customer.referralCount !== 1 ? 's' : ''}</span>
          </div>
        </td>

        {/* Wallet */}
        <td style={{ padding: '13px 16px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
            borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 700,
          }}>
            ₹{parseFloat(customer.wallet || 0).toLocaleString('en-IN')}
          </span>
        </td>

        {/* Expand */}
        <td style={{ padding: '13px 16px', textAlign: 'center' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: expanded ? '#008060' : '#f1f5f9',
            color: expanded ? 'white' : '#64748b',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
            border: `1px solid ${expanded ? '#008060' : '#e2e8f0'}`,
          }}>
            {expanded ? '▾' : '▸'}
          </div>
        </td>
      </tr>

      {/* Expand panel */}
      {expanded && (
        <tr>
          <td colSpan={6} style={{ padding: 0, background: '#f0fdf7' }}>
            <div style={{ borderTop: '2px solid #effaf6', borderBottom: '2px solid #effaf6' }}>
              {/* Panel header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '28px 1fr 140px 1fr',
                gap: 12, padding: '8px 14px',
                background: '#effaf6', fontSize: 11, fontWeight: 700,
                color: '#008060', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                <div />
                <div>Referred Customer</div>
                <div>Customer ID</div>
                <div>Coupon Code</div>
              </div>

              {parts.length === 0 ? (
                <div style={{ padding: '16px 14px', fontSize: 13, color: '#94a3b8' }}>
                  No referral details available.
                </div>
              ) : (
                parts.map((item, i) => <ReferredRow key={i} item={item} idx={i} />)
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

/* ── Page ────────────────────────────────────────────────────────── */
export default function ReferralStats() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await axios.get(`${API}/api/referral/stats`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load referral stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const referrers = (data?.referrers || []).filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = [c.firstName, c.lastName].filter(Boolean).join(' ').toLowerCase();
    return (
      name.includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      String(c.phone || '').includes(q)
    );
  });

  const toggleExpand = (id) => setExpanded(prev => (prev === id ? null : id));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Referral Overview</h1>
          <p className="page-subtitle">Track customers who have referred friends and their earned rewards.</p>
        </div>
        <button
          onClick={load}
          style={{
            height: 36, padding: '0 16px', borderRadius: 8,
            border: '1.5px solid var(--border)', background: 'white',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text)',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard
          label="Total Referrals"
          value={data?.stats.totalReferrals ?? '—'}
          sub="across all customers"
          accent="#008060"
        />
        <StatCard
          label="Wallet Credited"
          value={data ? `₹${data.stats.totalWallet.toLocaleString('en-IN')}` : '—'}
          sub="total points distributed"
          accent="#16a34a"
        />
        <StatCard
          label="Active Referrers"
          value={data?.stats.activeReferrers ?? '—'}
          sub="customers with ≥1 referral"
          accent="#8b5cf6"
        />
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: 320, padding: '9px 14px', borderRadius: 8,
            border: '1.5px solid var(--border)', fontSize: 13,
            outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            Loading referral data…
          </div>
        ) : referrers.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            {search ? 'No results for your search.' : 'No referrals recorded yet.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                {['Customer', 'Phone', 'Tier', 'Referrals', 'Wallet', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '11px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: '#64748b',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referrers.map(c => (
                <ReferrerRow
                  key={c.id}
                  customer={c}
                  expanded={expanded === c.id}
                  onToggle={() => toggleExpand(c.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
        {!loading && `${referrers.length} referrer${referrers.length !== 1 ? 's' : ''} shown`}
      </div>
    </div>
  );
}
