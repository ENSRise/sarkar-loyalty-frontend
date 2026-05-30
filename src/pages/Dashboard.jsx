import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PAGE_SIZE = 20;

const TIER_META = {
  silver:   { icon: '🥈', color: '#94a3b8', bg: '#f1f5f9' },
  gold:     { icon: '🥇', color: '#d97706', bg: '#fffbeb' },
  platinum: { icon: '💎', color: '#7c3aed', bg: '#f5f3ff' },
};

/* ── Pagination button ───────────────────────────────────────────── */
const PagBtn = ({ label, onClick, disabled, active }) => (
  <button onClick={onClick} disabled={disabled}
    style={{
      padding: '5px 10px', borderRadius: '6px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      border: active ? 'none' : '1px solid var(--border)',
      background: active ? 'var(--primary)' : disabled ? '#f8f9fb' : 'white',
      color: active ? 'white' : disabled ? '#bbb' : 'var(--text)',
      fontSize: '12px', fontWeight: 600, minWidth: '32px',
      fontFamily: 'inherit',
    }}>
    {label}
  </button>
);

export default function Dashboard() {
  const navigate = useNavigate();

  /* ── Stats (summary cards) ── */
  const [stats, setStats]           = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  /* ── Table ── */
  const [customers, setCustomers]   = useState([]);
  const [meta, setMeta]             = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [page, setPage]             = useState(1);

  /* ── Fetch stats once ── */
  useEffect(() => {
    axios.get('/api/customers/stats')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  /* ── Fetch paginated customers ── */
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search)     params.search = search;
      if (tierFilter) params.tier   = tierFilter;
      const { data } = await axios.get('/api/customers', { params });
      setCustomers(data.data?.customers || []);
      setMeta({ total: data.data.total, page: data.data.page, pages: data.data.pages });
    } catch {}
    setLoading(false);
  }, [page, search, tierFilter]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSearch = (val) => { setSearch(val);     setPage(1); };
  const handleTier   = (val) => { setTierFilter(val); setPage(1); };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your loyalty program</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Members</div>
          <div className="stat-value">{statsLoading ? '—' : (stats?.total ?? 0).toLocaleString('en-IN')}</div>
          <div className="stat-sub">All enrolled customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: 'var(--silver)' }}>🥈 Silver</div>
          <div className="stat-value">{statsLoading ? '—' : (stats?.silver ?? 0).toLocaleString('en-IN')}</div>
          <div className="stat-sub">₹0+ total spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: 'var(--gold)' }}>🥇 Gold</div>
          <div className="stat-value">{statsLoading ? '—' : (stats?.gold ?? 0).toLocaleString('en-IN')}</div>
          <div className="stat-sub">₹1,000+ total spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: 'var(--platinum)' }}>💎 Platinum</div>
          <div className="stat-value">{statsLoading ? '—' : (stats?.platinum ?? 0).toLocaleString('en-IN')}</div>
          <div className="stat-sub">₹5,000+ total spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ fontSize: '20px' }}>
            {statsLoading ? '—' : `₹${(stats?.totalSpent ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          </div>
          <div className="stat-sub">Across all members</div>
        </div>
      </div>

      {/* ── Customer table ── */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ margin: 0 }}>
            All Members
            {!loading && (
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                ({meta.total.toLocaleString('en-IN')})
              </span>
            )}
          </h3>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Tier filter pills */}
            {['', 'silver', 'gold', 'platinum'].map(t => {
              const meta_t = TIER_META[t];
              const active = tierFilter === t;
              return (
                <button
                  key={t || 'all'}
                  onClick={() => handleTier(t)}
                  style={{
                    padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: `1.5px solid ${active ? (t === '' ? '#008060' : meta_t.color) : '#e5e7eb'}`,
                    background: active ? (t === '' ? '#f0fdf4' : meta_t.bg) : '#fff',
                    color: active ? (t === '' ? '#008060' : meta_t.color) : '#6b7280',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                >
                  {t === '' ? 'All' : `${meta_t.icon} ${t.charAt(0).toUpperCase() + t.slice(1)}`}
                </button>
              );
            })}

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af' }}>🔍</span>
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search name, email…"
                style={{
                  paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                  borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13,
                  outline: 'none', fontFamily: 'inherit', width: 210,
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#008060'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ borderTopColor: 'var(--primary)', borderColor: '#e2e8f0', width: 28, height: 28, borderWidth: 3, margin: '0 auto 12px' }} />
            Loading…
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
            {meta.total === 0 && !search && !tierFilter
              ? 'No customers yet. Share the QR code to get started!'
              : 'No customers match your filters.'}
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Tier</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => {
                    const m = TIER_META[c.currentTier] || TIER_META.silver;
                    return (
                      <tr
                        key={c.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/customers/${c.shopifyCustomerId}`)}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {(page - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td style={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td>{c.phone || '—'}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', borderRadius: 20,
                            background: m.bg, color: m.color,
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {m.icon} {c.currentTier}
                          </span>
                        </td>
                        <td>{c.ordersCount ?? '—'}</td>
                        <td style={{ fontWeight: 600 }}>
                          ₹{parseFloat(c.totalSpent || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {meta.pages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Page {page} of {meta.pages} · {meta.total.toLocaleString('en-IN')} members
                </span>
                <div style={{ display: 'flex', gap: 5 }}>
                  <PagBtn label="← Prev" disabled={page <= 1} onClick={() => setPage(p => p - 1)} />
                  {Array.from({ length: Math.min(meta.pages, 7) }, (_, i) => {
                    const p = meta.pages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= meta.pages - 3 ? meta.pages - 6 + i : page - 3 + i;
                    return <PagBtn key={p} label={p} active={p === page} onClick={() => setPage(p)} />;
                  })}
                  <PagBtn label="Next →" disabled={page >= meta.pages} onClick={() => setPage(p => p + 1)} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
