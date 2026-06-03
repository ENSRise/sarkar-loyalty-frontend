import { useState } from 'react';
import axios from 'axios';

const AMOUNTS = [200, 400, 600];

const TIER = {
  silver:   { color: '#4a5568', bg: '#f1f5f9', icon: '🥈' },
  gold:     { color: '#78450a', bg: '#fef3c7', icon: '🥇' },
  platinum: { color: '#5b21b6', bg: '#ede9fe', icon: '💎' },
};

const STATUS_STYLE = {
  Used:        { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  Unused:      { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
  PartialUsed: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  Pending:     { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
};

export default function AmountSettlement() {
  const [phone,    setPhone]    = useState('');
  const [amount,   setAmount]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState(null);   // from GET /status
  const [result,   setResult]   = useState(null);   // from POST /settle
  const [error,    setError]    = useState('');
  const [lookingUp,setLookingUp]= useState(false);

  // ── Look up customer status by phone ──────────────────────────────
  const lookupStatus = async () => {
    if (!phone.trim()) return;
    setLookingUp(true);
    setError('');
    setStatus(null);
    setResult(null);
    try {
      const { data } = await axios.get(`/api/settlement/status?phone=${encodeURIComponent(phone.trim())}`);
      setStatus(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Customer not found');
    } finally {
      setLookingUp(false);
    }
  };

  // ── Submit settlement ─────────────────────────────────────────────
  const handleSettle = async () => {
    if (!phone.trim() || !amount) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await axios.post('/api/settlement/settle', {
        phone: phone.trim(),
        amount: parseInt(amount, 10),
      });
      setResult(data.data);
      setStatus(null); // refresh status after settle
    } catch (err) {
      const errData = err.response?.data;
      setError(errData?.message || 'Settlement failed');
      // If a coupon already exists, show it
      if (errData?.error?.coupon) {
        setResult({ existingCoupon: errData.error });
      }
    } finally {
      setLoading(false);
    }
  };

  const tierMeta = TIER[status?.customer?.currentTier] || TIER.silver;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Amount Settlement</h1>
        <p className="page-subtitle">Generate a settlement coupon from a customer's referral wallet</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Left panel: form ── */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 18 }}>
            Settlement Details
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Customer Phone Number
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                style={{ flex: 1, fontSize: 14 }}
                placeholder="e.g. 9871232456"
                value={phone}
                onChange={e => { setPhone(e.target.value); setStatus(null); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && lookupStatus()}
              />
              <button
                onClick={lookupStatus}
                disabled={lookingUp || !phone.trim()}
                style={{
                  padding: '0 14px', borderRadius: 8, border: '1.5px solid var(--border)',
                  background: 'white', fontSize: 13, fontWeight: 600, cursor: lookingUp || !phone.trim() ? 'not-allowed' : 'pointer',
                  color: 'var(--primary)', whiteSpace: 'nowrap', opacity: lookingUp || !phone.trim() ? 0.6 : 1,
                }}>
                {lookingUp ? '…' : 'Look up'}
              </button>
            </div>
          </div>

          {/* Amount selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Settlement Amount
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 9, fontSize: 15, fontWeight: 700,
                    border: `2px solid ${amount === String(a) ? 'var(--primary)' : 'var(--border)'}`,
                    background: amount === String(a) ? 'var(--primary)' : 'white',
                    color: amount === String(a) ? 'white' : 'var(--text)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  ₹{a}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 9,
              padding: '11px 14px', fontSize: 13, color: '#b91c1c',
              marginBottom: 16, lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          {/* Settle button */}
          <button
            onClick={handleSettle}
            disabled={loading || !phone.trim() || !amount}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 9,
              border: 'none', background: 'var(--primary)', color: 'white',
              fontSize: 14, fontWeight: 700, cursor: loading || !phone.trim() || !amount ? 'not-allowed' : 'pointer',
              opacity: loading || !phone.trim() || !amount ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}>
            {loading ? 'Processing…' : `Generate ₹${amount || '—'} Settlement Coupon`}
          </button>
        </div>

        {/* ── Right panel: customer info + result ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Customer card (from status lookup) */}
          {status && (
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#008060,#006e52)',
                  color: 'white', fontSize: 18, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {(status.customer.firstName || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                    {status.customer.firstName} {status.customer.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {status.customer.phone}
                  </div>
                </div>
                <span style={{
                  marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: tierMeta.bg, color: tierMeta.color,
                  borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700,
                }}>
                  {tierMeta.icon} {status.customer.currentTier}
                </span>
              </div>

              {/* Balance + existing coupon */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ background: '#f8fafc', borderRadius: 9, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Available Balance</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#008060', marginTop: 3 }}>
                    ₹{parseFloat(status.totalAvailableBalance || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 9, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Final Coupon</div>
                  {status.finalCoupon.code ? (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginTop: 3, fontFamily: 'monospace' }}>
                        {status.finalCoupon.code}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        ₹{status.finalCoupon.value} · {status.finalCoupon.used ? '✅ Used' : '⏳ Unused'}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>None yet</div>
                  )}
                </div>
              </div>

              {/* Referral breakdown */}
              {status.referralPart?.length > 0 && (
                <ReferralBreakdown parts={status.referralPart} />
              )}
            </div>
          )}

          {/* Settlement result */}
          {result && !result.existingCoupon && (
            <div style={{
              background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 14, padding: 22,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>🎉</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#166534' }}>Settlement Coupon Generated!</div>
                  <div style={{ fontSize: 12, color: '#4ade80', marginTop: 2 }}>
                    Share this code with the customer
                  </div>
                </div>
              </div>

              <div style={{
                background: 'white', border: '2px dashed #86efac', borderRadius: 12,
                padding: '16px 20px', textAlign: 'center', marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Coupon Code
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#008060', fontFamily: 'monospace', letterSpacing: 3 }}>
                  {result.settlement.couponCode}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#166534', marginTop: 6 }}>
                  ₹{result.settlement.couponValue} Off
                </div>
              </div>

              <ReferralBreakdown parts={result.updatedReferralPart} title="Updated Referral Breakdown" />
            </div>
          )}

          {/* Existing coupon error detail */}
          {result?.existingCoupon && (
            <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 14, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#854d0e', marginBottom: 8 }}>⚠️ Existing Coupon Found</div>
              <div style={{ fontSize: 13, color: '#78350f' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{result.existingCoupon.coupon}</span>
                &nbsp;·&nbsp;₹{result.existingCoupon.value}
                &nbsp;·&nbsp;{result.existingCoupon.usedInOrder ? 'Already used in an order' : 'Not yet used'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Referral breakdown table ──────────────────────────────────── */
function ReferralBreakdown({ parts, title = 'Referral Breakdown' }) {
  const eligible = parts.filter(e => e.couponCode);
  if (!eligible.length) return null;

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ borderRadius: 9, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        {eligible.map((entry, i) => {
          const tierAmt    = parseFloat(entry.tierAmount   || 0);
          const remaining  = entry['remaining-amount'] !== undefined
            ? parseFloat(entry['remaining-amount'])
            : tierAmt;
          const consumed   = tierAmt - remaining;
          const pct        = tierAmt > 0 ? Math.round((consumed / tierAmt) * 100) : 0;
          const status     = entry['coupon-status'] || 'Pending';

          return (
            <div key={i} style={{
              padding: '10px 14px',
              background: i % 2 === 0 ? 'white' : '#f8fafc',
              borderBottom: i < eligible.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{entry.name || '—'}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8, fontFamily: 'monospace' }}>
                    {entry.couponCode}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={status} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>₹{tierAmt}</span>
                </div>
              </div>
              {/* Progress bar */}
              {tierAmt > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 5, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#22c55e' : '#3b82f6', borderRadius: 99, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap' }}>
                    ₹{consumed} used · ₹{remaining} left
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
