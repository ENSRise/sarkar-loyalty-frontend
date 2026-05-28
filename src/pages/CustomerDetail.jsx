import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TIER_CONFIG = {
  silver: {
    label: 'SILVER',
    memberLabel: 'member',
    icon: '🥈',
    gradient: 'linear-gradient(135deg, #2c3a4a 0%, #3d5068 35%, #4a6680 60%, #6b8fa8 85%, #8fb3c8 100%)',
    accentStrong: '#e2eaf2',
    accentDim: 'rgba(226,234,242,0.55)',
    accentFaint: 'rgba(226,234,242,0.12)',
    glow: 'rgba(107,143,168,0.5)',
    ring: '#8fb3c8',
    divider: 'rgba(226,234,242,0.2)',
    benefitBg: 'linear-gradient(135deg, #1e2d3d 0%, #2c3a4a 100%)',
  },
  gold: {
    label: 'GOLD',
    memberLabel: 'member',
    icon: '🥇',
    gradient: 'linear-gradient(135deg, #2a1500 0%, #5a2d00 30%, #9a5500 55%, #c98000 75%, #e8b84b 100%)',
    accentStrong: '#ffd966',
    accentDim: 'rgba(255,217,102,0.6)',
    accentFaint: 'rgba(255,217,102,0.1)',
    glow: 'rgba(232,184,75,0.55)',
    ring: '#e8b84b',
    divider: 'rgba(255,217,102,0.2)',
    benefitBg: 'linear-gradient(135deg, #1a0d00 0%, #2a1500 100%)',
  },
  platinum: {
    label: 'PLATINUM',
    memberLabel: 'member',
    icon: '💎',
    gradient: 'linear-gradient(135deg, #08081a 0%, #110e35 30%, #1e1458 55%, #2d1b69 75%, #5a2da0 100%)',
    accentStrong: '#d8a8e8',
    accentDim: 'rgba(216,168,232,0.6)',
    accentFaint: 'rgba(216,168,232,0.1)',
    glow: 'rgba(178,102,255,0.5)',
    ring: '#9c27b0',
    divider: 'rgba(216,168,232,0.2)',
    benefitBg: 'linear-gradient(135deg, #05040f 0%, #110e35 100%)',
  },
};

const STATUS_STYLE = {
  Hold:   { bg: '#fef9c3', color: '#854d0e', dot: '#ca8a04' },
  Cancel: { bg: '#fee2e2', color: '#991b1b', dot: '#dc2626' },
  Credit: { bg: '#dcfce7', color: '#166534', dot: '#16a34a' },
};

/* ── Wide membership card matching reference style ───────────── */
function MembershipCard({ customer, cfg, benefits }) {
  const acNo = customer.shopifyCustomerId
    ? `RC${String(customer.shopifyCustomerId).slice(-7).toUpperCase()}`
    : 'RC0000000';
  const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'MEMBER';
  const balance  = parseFloat(customer.totalSpent || 0).toLocaleString('en-IN');
  const phone    = customer.phone ? `+${String(customer.phone).replace(/^\+/, '')}` : '—';

  return (
    <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>

      {/* ── Main card face ── */}
      <div style={{
        background: cfg.gradient,
        borderRadius: '20px 20px 0 0',
        padding: '28px 32px 26px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 4px 0 rgba(0,0,0,0.15), 0 20px 60px ${cfg.glow}`,
        border: `1px solid ${cfg.ring}30`,
        borderBottom: 'none',
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', border: `1px solid ${cfg.accentFaint}`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', border: `1px solid ${cfg.accentFaint}`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: cfg.accentFaint, pointerEvents: 'none' }} />

        {/* Top row — tier label + brand stamp */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, marginBottom: 20 }}>
          <div>
            <div style={{
              fontSize: 32, fontWeight: 900, color: cfg.accentStrong,
              letterSpacing: 4, lineHeight: 1,
              textShadow: `0 2px 12px ${cfg.glow}`,
            }}>{cfg.label}</div>
            <div style={{ fontSize: 13, color: cfg.accentDim, letterSpacing: 3, textTransform: 'uppercase', marginTop: 2, fontWeight: 500 }}>{cfg.memberLabel}</div>
          </div>

          {/* Brand stamp — like the R/Visa in reference */}
          <div style={{
            width: 52, height: 52,
            background: cfg.accentFaint,
            border: `2px solid ${cfg.ring}50`,
            borderRadius: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontSize: 20, lineHeight: 1 }}>{cfg.icon}</div>
            <div style={{ fontSize: 7, color: cfg.accentDim, letterSpacing: 1, marginTop: 2, textTransform: 'uppercase', fontWeight: 700 }}>Sarkar</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: cfg.divider, marginBottom: 20, position: 'relative', zIndex: 1 }} />

        {/* Customer name */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 22 }}>
          <div style={{
            fontSize: 22, fontWeight: 800,
            color: cfg.accentStrong,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}>{fullName}</div>
        </div>

        {/* Detail grid — 3 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 24px', position: 'relative', zIndex: 1 }}>
          {[
            { label: 'A/C Number',   value: acNo },
            { label: 'A/C Balance',  value: `₹${balance}` },
            { label: 'Contact No.',  value: phone },
            { label: 'Email',        value: customer.email || '—' },
            { label: 'Birthday',     value: customer.birthdayDate || '—' },
            { label: 'Anniversary',  value: customer.anniversaryDate || '—' },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: 9, color: cfg.accentDim, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, marginBottom: 3 }}>{item.label}</div>
              <div style={{
                fontSize: 13, fontWeight: 600, color: cfg.accentStrong,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Benefits strip (attached below card) ── */}
      <div style={{
        background: cfg.benefitBg,
        borderRadius: '0 0 20px 20px',
        padding: '16px 32px',
        border: `1px solid ${cfg.ring}30`,
        borderTop: `1px solid ${cfg.ring}20`,
        boxShadow: `0 20px 40px ${cfg.glow}`,
      }}>
        <div style={{ fontSize: 9, color: cfg.accentDim, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>
          {cfg.label} Member Benefits
        </div>
        {benefits.length === 0 ? (
          <div style={{ fontSize: 12, color: cfg.accentDim }}>No benefits configured yet.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {benefits.map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: cfg.accentFaint,
                border: `1px solid ${cfg.ring}30`,
                borderRadius: 20,
                padding: '5px 14px',
                fontSize: 12, color: cfg.accentStrong,
                fontWeight: 500,
              }}>
                <span style={{ color: cfg.ring, fontSize: 11, fontWeight: 700 }}>✓</span>
                {b}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Referral card ───────────────────────────────────────────── */
function ReferralCard({ item, index }) {
  const [copied, setCopied] = useState(false);
  const initials = (item.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = [...(item.name || 'A')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  const copy = useCallback(() => {
    if (!item.couponCode) return;
    navigator.clipboard.writeText(item.couponCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [item.couponCode]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderRadius: 14, padding: '20px 22px',
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.18s, box-shadow 0.18s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.28)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.18)'; }}
    >
      {/* Index number watermark */}
      <div style={{
        position: 'absolute', top: 12, right: 16,
        fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.08)',
        letterSpacing: 2,
      }}>#{String(index + 1).padStart(2, '0')}</div>

      {/* Glow blob */}
      <div style={{
        position: 'absolute', bottom: -30, right: -30,
        width: 100, height: 100, borderRadius: '50%',
        background: `radial-gradient(circle, hsla(${hue},70%,55%,0.12) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Top: avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, hsl(${hue},60%,45%), hsl(${hue},70%,35%))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 15, fontWeight: 800,
          boxShadow: `0 4px 12px hsla(${hue},60%,45%,0.4)`,
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{item.name || '—'}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1, fontFamily: 'monospace' }}>
            +91 {item.phonenumber || '—'}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

      {/* Customer ID */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
          Customer ID
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
          {item.customer_id || '—'}
        </div>
      </div>

      {/* Coupon code */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
          Coupon Code
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, flex: 1,
            background: 'rgba(0,128,96,0.12)', border: '1px solid rgba(0,128,96,0.25)',
            borderRadius: 8, padding: '7px 12px',
          }}>
            <span style={{ fontSize: 13 }}>🎫</span>
            <span style={{
              fontSize: 13, fontWeight: 800, color: '#34d399',
              fontFamily: 'monospace', letterSpacing: 1.5,
            }}>
              {item.couponCode || '—'}
            </span>
          </div>
          {item.couponCode && (
            <button onClick={copy} style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: copied ? 'rgba(0,128,96,0.25)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${copied ? 'rgba(0,128,96,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: copied ? '#34d399' : '#64748b',
              cursor: 'pointer', fontSize: 14, transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {copied ? '✓' : '⎘'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────── */
export default function CustomerDetail() {
  const { shopifyCustomerId } = useParams();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');

  useEffect(() => {
    axios.get(`/api/customers/${shopifyCustomerId}/orders`)
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [shopifyCustomerId]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12, color: '#697386' }}>
      <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, borderColor: '#e3e8ef', borderTopColor: 'var(--primary)' }} />
      Loading customer profile…
    </div>
  );

  if (!data || !data.customer) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#697386' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Customer not found</div>
      <button onClick={() => navigate('/customers')} style={{ marginTop: 8, padding: '8px 20px', borderRadius: 8, background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
        Back to Customers
      </button>
    </div>
  );

  const { customer, orders } = data;
  const tier     = customer.currentTier || 'silver';
  const cfg      = TIER_CONFIG[tier] || TIER_CONFIG.silver;
  const benefits = customer.tierBenefits?.additionReward || [];

  const creditOrders = (orders || []).filter(o => o.orderStatus === 'Credit');
  const holdOrders   = (orders || []).filter(o => o.orderStatus === 'Hold');
  const cancelOrders = (orders || []).filter(o => o.orderStatus === 'Cancel');
  const creditTotal  = creditOrders.reduce((s, o) => s + parseFloat(o.totalPrice || 0), 0);
  const holdTotal    = holdOrders.reduce((s, o) => s + parseFloat(o.totalPrice || 0), 0);

  const referralParts  = customer.customerReferralPart || [];
  const referralCount  = customer.referralCount || 0;
  const walletBalance  = parseFloat(customer.wallet || 0);

  const tabs = [
    { id: 'transactions', label: `Transactions (${orders?.length || 0})` },
    { id: 'overview',     label: 'Spend Breakdown' },
    { id: 'referrals',    label: `Referrals (${referralCount})` },
  ];

  return (
    <div style={{ animation: 'fadeSlideUp 0.3s ease' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button onClick={() => navigate('/customers')} style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 9,
          padding: '8px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontWeight: 600, color: '#697386',
          boxShadow: 'var(--shadow)', transition: 'box-shadow 0.15s, transform 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          ← Back
        </button>
        <div>
          <h1 className="page-title">{customer.firstName} {customer.lastName}</h1>
          <p className="page-subtitle">Customer Profile &amp; Loyalty Details</p>
        </div>
      </div>

      {/* ── Membership Card (centered, full-width up to 680px) ── */}
      <div style={{ marginBottom: 32 }}>
        <MembershipCard customer={customer} cfg={cfg} benefits={benefits} />
      </div>

      {/* ── KPI summary row ── */}
      <div style={{ maxWidth: 680, margin: '0 auto 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
          {[
            { label: 'Total Spent',  value: `₹${parseFloat(customer.totalSpent || 0).toLocaleString('en-IN')}`, color: '#5c6ac4', sub: 'lifetime value' },
            { label: 'Total Orders', value: customer.ordersCount || 0,                                            color: '#008060', sub: 'orders placed' },
            { label: 'Reward Rate',  value: customer.tierBenefits?.reward || '—',                                 color: cfg.ring,  sub: 'on every order' },
          ].map(k => (
            <div key={k.label} style={{
              background: 'white', borderRadius: 12, border: '1px solid var(--border)',
              padding: '16px 18px', boxShadow: 'var(--shadow)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: k.color, lineHeight: 1.1 }}>{k.value}</div>
              <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Referrals Made', value: referralCount,                                                         color: '#008060', sub: 'friends referred', icon: '🎁' },
            { label: 'Wallet Balance', value: `₹${walletBalance.toLocaleString('en-IN')}`,                           color: '#d97706', sub: 'reward points',    icon: '💰' },
            { label: 'Tier Status',    value: `${cfg.icon} ${cfg.label.charAt(0) + cfg.label.slice(1).toLowerCase()}`, color: cfg.ring,  sub: 'current tier',    icon: null },
          ].map(k => (
            <div key={k.label} style={{
              background: 'white', borderRadius: 12, border: '1px solid var(--border)',
              padding: '16px 18px', boxShadow: 'var(--shadow)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: k.color, lineHeight: 1.1 }}>{k.value}</div>
              <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 20, display: 'flex' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 20px', background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--primary)' : 'transparent'}`,
              color: activeTab === tab.id ? 'var(--primary)' : '#697386',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 13, cursor: 'pointer', transition: 'color 0.15s', marginBottom: -1,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transactions tab */}
        {activeTab === 'transactions' && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow)', overflow: 'hidden', animation: 'fadeSlideUp 0.2s ease' }}>
            {!orders || orders.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#697386' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🛒</div>
                No transactions found for this customer.
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Tax</th>
                      <th>Discount</th>
                      <th>Status</th>
                      <th>Credit Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => {
                      const s = STATUS_STYLE[order.orderStatus] || STATUS_STYLE.Hold;
                      return (
                        <tr key={order.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13 }}>{order.orderName || order.orderId}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>#{String(order.orderId).slice(-8)}</div>
                          </td>
                          <td style={{ fontSize: 12, color: '#697386' }}>
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                            ₹{parseFloat(order.totalPrice || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ fontSize: 12, color: '#697386' }}>
                            ₹{parseFloat(order.totalTax || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ fontSize: 12, color: '#697386' }}>
                            {parseFloat(order.totalDiscounts || 0) > 0
                              ? `−₹${parseFloat(order.totalDiscounts).toLocaleString('en-IN')}`
                              : '—'}
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: s.bg, color: s.color,
                              borderRadius: 20, padding: '3px 10px',
                              fontSize: 11, fontWeight: 700,
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                              {order.orderStatus}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: '#697386' }}>{order.creditDay || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Spend Breakdown tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeSlideUp 0.2s ease' }}>
            {[
              { label: 'Credited Orders', count: creditOrders.length, amount: creditTotal, color: '#16a34a', bg: '#dcfce7', dot: '#16a34a' },
              { label: 'On Hold',         count: holdOrders.length,   amount: holdTotal,   color: '#854d0e', bg: '#fef9c3', dot: '#ca8a04' },
              { label: 'Cancelled',       count: cancelOrders.length, amount: 0,           color: '#991b1b', bg: '#fee2e2', dot: '#dc2626' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', background: row.bg, borderRadius: 12,
                border: `1px solid ${row.dot}20`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: row.dot, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{row.label}</div>
                    <div style={{ fontSize: 12, color: row.color, opacity: 0.75, marginTop: 2 }}>{row.count} order{row.count !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                {row.amount > 0 && (
                  <div style={{ fontSize: 18, fontWeight: 800, color: row.color }}>
                    ₹{row.amount.toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Referrals tab */}
        {activeTab === 'referrals' && (
          <div style={{ animation: 'fadeSlideUp 0.2s ease' }}>

            {/* Summary banner */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderRadius: 14, padding: '20px 24px', marginBottom: 20,
              border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'rgba(0,128,96,0.2)', border: '1px solid rgba(0,128,96,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>🎁</div>
                <div>
                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Referral Activity</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
                    {referralCount} <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>friend{referralCount !== 1 ? 's' : ''} referred</span>
                  </div>
                </div>
              </div>

              <div style={{ height: 40, width: 1, background: 'rgba(255,255,255,0.07)' }} />

              <div>
                <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Wallet Earned</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#34d399', letterSpacing: '-0.5px' }}>
                  ₹{walletBalance.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ marginLeft: 'auto' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(0,128,96,0.15)', border: '1px solid rgba(0,128,96,0.3)',
                  borderRadius: 20, padding: '5px 14px', fontSize: 12, color: '#34d399', fontWeight: 600,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                  Active Referrer
                </div>
              </div>
            </div>

            {/* Cards grid */}
            {referralParts.length === 0 ? (
              <div style={{
                background: '#f8fafc', border: '1px dashed #e2e8f0',
                borderRadius: 14, padding: '52px 24px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>No referrals yet</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>
                  When this customer refers friends, their details will appear here.
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {referralParts.map((item, i) => (
                  <ReferralCard key={i} item={item} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
