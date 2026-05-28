import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PAGE_SIZE = 20;

const TIER_META = {
  silver:   { icon: '🥈', color: '#94a3b8', bg: '#f1f5f9' },
  gold:     { icon: '🥇', color: '#d97706', bg: '#fffbeb' },
  platinum: { icon: '💎', color: '#7c3aed', bg: '#f5f3ff' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [page, setPage]           = useState(1);

  useEffect(() => {
    axios.get('/api/customers', { params: { limit: 1000 } })
      .then(r => setCustomers(r.data.data?.customers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const silverCount   = customers.filter(c => c.currentTier === 'silver').length;
  const goldCount     = customers.filter(c => c.currentTier === 'gold').length;
  const platinumCount = customers.filter(c => c.currentTier === 'platinum').length;
  const totalSpent    = customers.reduce((s, c) => s + parseFloat(c.totalSpent || 0), 0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return customers.filter(c => {
      const matchTier   = tierFilter === 'all' || c.currentTier === tierFilter;
      const matchSearch = !q || [c.firstName, c.lastName, c.email, String(c.phone || '')]
        .join(' ').toLowerCase().includes(q);
      return matchTier && matchSearch;
    });
  }, [customers, search, tierFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleTier   = (val) => { setTierFilter(val); setPage(1); };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your loyalty program</p>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Members</div>
          <div className="stat-value">{loading ? '—' : customers.length}</div>
          <div className="stat-sub">All enrolled customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: 'var(--silver)' }}>🥈 Silver</div>
          <div className="stat-value">{loading ? '—' : silverCount}</div>
          <div className="stat-sub">₹0+ total spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: 'var(--gold)' }}>🥇 Gold</div>
          <div className="stat-value">{loading ? '—' : goldCount}</div>
          <div className="stat-sub">₹1,000+ total spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: 'var(--platinum)' }}>💎 Platinum</div>
          <div className="stat-value">{loading ? '—' : platinumCount}</div>
          <div className="stat-sub">₹5,000+ total spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ fontSize: '20px' }}>
            {loading ? '—' : `₹${totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          </div>
          <div className="stat-sub">Across all members</div>
        </div>
      </div>

      {/* Customer table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ margin: 0 }}>
            All Members
            {!loading && (
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                ({filtered.length}{filtered.length !== customers.length ? ` of ${customers.length}` : ''})
              </span>
            )}
          </h3>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Tier filter pills */}
            {['all', 'silver', 'gold', 'platinum'].map(t => {
              const meta = TIER_META[t];
              const active = tierFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => handleTier(t)}
                  style={{
                    padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: `1.5px solid ${active ? (t === 'all' ? '#008060' : meta.color) : '#e5e7eb'}`,
                    background: active ? (t === 'all' ? '#f0fdf4' : meta.bg) : '#fff',
                    color: active ? (t === 'all' ? '#008060' : meta.color) : '#6b7280',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                >
                  {t === 'all' ? 'All' : `${meta.icon} ${t.charAt(0).toUpperCase() + t.slice(1)}`}
                </button>
              );
            })}

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af' }}>🔍</span>
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search name, email, phone…"
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
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
            {customers.length === 0 ? 'No customers yet. Share the QR code to get started!' : 'No customers match your filters.'}
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
                  {pageRows.map((c, i) => {
                    const meta = TIER_META[c.currentTier] || TIER_META.silver;
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
                            background: meta.bg, color: meta.color,
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {meta.icon} {c.currentTier}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ padding: '6px 14px', borderRadius: 7, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontFamily: 'inherit' }}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                    const p = start + idx;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        style={{ padding: '6px 12px', borderRadius: 7, border: `1.5px solid ${p === page ? '#008060' : '#e5e7eb'}`, background: p === page ? '#008060' : '#fff', color: p === page ? 'white' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{ padding: '6px 14px', borderRadius: 7, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontFamily: 'inherit' }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
