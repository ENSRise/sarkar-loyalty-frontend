import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const QUICK_POINTS = [50, 100, 200, 500];

const TIER_BADGE = {
  silver:   { icon: '🥈', color: '#4a5568', bg: '#f1f5f9' },
  gold:     { icon: '🥇', color: '#78450a', bg: '#fef3c7' },
  platinum: { icon: '💎', color: '#5b21b6', bg: '#ede9fe' },
};

export default function CustomerBonus() {
  const navigate = useNavigate();

  const [query, setQuery]   = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [customer, setCustomer] = useState(null);
  const [history, setHistory]   = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [points, setPoints] = useState('');
  const [note, setNote]     = useState('');
  const [granting, setGranting] = useState(false);
  const [formError, setFormError]     = useState('');
  const [result, setResult] = useState(null);

  const loadHistory = async (shopifyCustomerId) => {
    setLoadingHistory(true);
    try {
      const r = await axios.get(`/api/customer-bonus/history/${shopifyCustomerId}`);
      setHistory(r.data.data.history || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError('');
    setFormError('');
    setResult(null);

    const value = query.trim();
    if (!value) {
      setSearchError('Enter a phone number or email');
      return;
    }

    setSearching(true);
    setCustomer(null);
    setHistory([]);
    try {
      // Single box, auto-detected: "@" → email lookup, otherwise treated as phone
      const params = value.includes('@') ? { email: value } : { phone: value };
      const r = await axios.get('/api/customer-bonus/find', { params });
      const found = r.data.data.customer;
      setCustomer(found);
      loadHistory(found.shopifyCustomerId);
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Customer not found');
    } finally {
      setSearching(false);
    }
  };

  const handleGrant = async (e) => {
    e.preventDefault();
    setFormError('');
    setResult(null);

    const trimmedNote = note.trim();
    const pointsVal = points.trim();

    if (!pointsVal && !trimmedNote) {
      setFormError('Enter bonus points and/or a note');
      return;
    }
    if (pointsVal && (!Number.isFinite(Number(pointsVal)) || Number(pointsVal) <= 0)) {
      setFormError('Points must be a positive number');
      return;
    }

    setGranting(true);
    try {
      const r = await axios.post('/api/customer-bonus/grant', {
        shopifyCustomerId: customer.shopifyCustomerId,
        points: pointsVal || undefined,
        note: trimmedNote || undefined,
      });
      setResult({ points: pointsVal ? Number(pointsVal) : null, note: trimmedNote || null, message: r.data.message });
      setPoints('');
      setNote('');
      loadHistory(customer.shopifyCustomerId);
      if (pointsVal) {
        setCustomer(c => ({ ...c, walletBalance: (c.walletBalance || 0) + Number(pointsVal) }));
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save');
    } finally {
      setGranting(false);
    }
  };

  const tierBadge = TIER_BADGE[customer?.currentTier] || TIER_BADGE.silver;

  return (
    <div style={{ animation: 'fadeSlideUp 0.3s ease' }}>
      <div className="page-header">
        <h1 className="page-title">🎁 Customer Bonus</h1>
        <p className="page-subtitle">Look up a customer and grant referral-style bonus points or leave an internal note</p>
      </div>

      {/* ── Hero search bar ── */}
      <form onSubmit={handleSearch} style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 16, padding: '26px 28px', marginBottom: 24,
        boxShadow: '0 8px 30px rgba(15,23,42,0.18)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Find a customer
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, opacity: 0.5 }}>🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Phone number or email…"
              style={{
                width: '100%', padding: '13px 14px 13px 38px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
                color: 'white', fontSize: 14, outline: 'none',
              }}
            />
          </div>
          <button type="submit" disabled={searching} style={{
            padding: '0 26px', borderRadius: 10, border: 'none',
            background: searching ? 'rgba(0,128,96,0.5)' : '#008060',
            color: 'white', fontWeight: 700, fontSize: 14, cursor: searching ? 'default' : 'pointer',
            whiteSpace: 'nowrap', transition: 'background 0.15s',
          }}>
            {searching ? 'Searching…' : 'Find Customer'}
          </button>
        </div>
        {searchError && (
          <div style={{
            marginTop: 12, fontSize: 12, color: '#fca5a5', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>⚠️</span> {searchError}
          </div>
        )}
      </form>

      {!customer && !searching && (
        <div style={{
          background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: 14,
          padding: '52px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔎</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>No customer selected</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Search by phone or email above to get started.</div>
        </div>
      )}

      {/* ── Customer found: split layout ── */}
      {customer && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'flex-start' }}>

          {/* ── Left: profile + grant form ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Profile card */}
            <div style={{
              background: 'white', border: '1px solid var(--border)', borderRadius: 14,
              padding: 20, boxShadow: 'var(--shadow)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#008060,#006e52)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 700,
                }}>
                  {(customer.firstName || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', cursor: 'pointer' }}
                    onClick={() => navigate(`/customers/${customer.shopifyCustomerId}`)}
                    title="View full profile"
                  >
                    {customer.firstName} {customer.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {customer.phone ? `+${String(customer.phone).replace(/^\+/, '')}` : '—'}
                  </div>
                </div>
                <span style={{
                  background: tierBadge.bg, color: tierBadge.color,
                  borderRadius: 20, padding: '4px 11px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  {tierBadge.icon} {customer.currentTier}
                </span>
              </div>

              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                ✉️ {customer.email || '—'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#fffbeb', borderRadius: 9, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Wallet</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706', marginTop: 3 }}>
                    ₹{parseFloat(customer.walletBalance || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: '#eef2ff', borderRadius: 9, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: '#3730a3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Spent</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#5c6ac4', marginTop: 3 }}>
                    ₹{parseFloat(customer.totalSpent || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Grant form */}
            <form onSubmit={handleGrant} style={{
              background: 'white', border: '1px solid var(--border)', borderRadius: 14,
              padding: 20, boxShadow: 'var(--shadow)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                🎁 Grant Bonus / Add Note
              </div>

              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Quick Points
              </label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {QUICK_POINTS.map(p => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPoints(String(p))}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      border: `2px solid ${points === String(p) ? '#008060' : 'var(--border)'}`,
                      background: points === String(p) ? '#008060' : 'white',
                      color: points === String(p) ? 'white' : 'var(--text)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    ₹{p}
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Custom Amount (₹)
                </label>
                <input type="number" min="1" value={points} onChange={e => setPoints(e.target.value)} placeholder="Enter a custom amount…"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Note
                </label>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for this bonus / internal remark…" rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>

              {formError && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 9,
                  padding: '10px 13px', fontSize: 12, color: '#b91c1c', marginBottom: 14,
                }}>
                  {formError}
                </div>
              )}

              <button type="submit" disabled={granting} style={{
                width: '100%', padding: '12px 0', borderRadius: 9, border: 'none',
                background: granting ? 'rgba(22,163,74,0.6)' : '#16a34a',
                color: 'white', fontWeight: 700, fontSize: 14, cursor: granting ? 'default' : 'pointer',
                transition: 'background 0.15s',
              }}>
                {granting ? 'Saving…' : 'Save'}
              </button>
            </form>
          </div>

          {/* ── Right: result + history ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Celebration result */}
            {result && (
              <div style={{
                background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 14, padding: 22,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: result.points || result.note ? 14 : 0 }}>
                  <span style={{ fontSize: 28 }}>🎉</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#166534' }}>{result.message}</div>
                    <div style={{ fontSize: 12, color: '#4ade80', marginTop: 2 }}>Saved to {customer.firstName}'s account</div>
                  </div>
                </div>
                {result.points && (
                  <div style={{
                    background: 'white', border: '2px dashed #86efac', borderRadius: 12,
                    padding: '14px 18px', textAlign: 'center', marginBottom: result.note ? 12 : 0,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                      Points Added to Wallet
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#008060' }}>₹{result.points}</div>
                  </div>
                )}
                {result.note && (
                  <div style={{ fontSize: 13, color: '#166534', background: 'white', borderRadius: 9, padding: '10px 14px' }}>
                    📝 {result.note}
                  </div>
                )}
              </div>
            )}

            {/* History */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                📜 Bonus &amp; Note History
              </div>
              {loadingHistory ? (
                <div style={{ padding: 28, textAlign: 'center', color: '#697386', fontSize: 13 }}>Loading…</div>
              ) : history.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No bonus or note history yet.</div>
              ) : (
                <div>
                  {history.map((h, i) => (
                    <div key={h.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '14px 20px',
                      background: i % 2 === 0 ? 'white' : '#f8fafc',
                      borderBottom: i < history.length - 1 ? '1px solid #f1f5f9' : 'none',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: h.points ? '#fef3c7' : '#eef2ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                      }}>
                        {h.points ? '🎁' : '📝'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: h.points ? '#16a34a' : '#94a3b8' }}>
                            {h.points ? `₹${h.points} bonus` : 'Note'}
                          </span>
                          <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {new Date(h.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {h.note && (
                          <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 3 }}>{h.note}</div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                          {h.couponCode && (
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>Ref: {h.couponCode}</span>
                          )}
                          {h.grantedBy && (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>· by {h.grantedBy}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
