import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/* ── Helpers ─────────────────────────────────────────────────────── */
const fmtShort = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

const fmtFull = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ── Tier config ─────────────────────────────────────────────────── */
const TIER = {
  silver:   { bg: 'linear-gradient(135deg,#f1f3f5,#e2e8f0)', color: '#4a5568', border: '#d1d9e6', icon: '🥈' },
  gold:     { bg: 'linear-gradient(135deg,#fff8e1,#fef3c7)', color: '#78450a', border: '#fde68a', icon: '🥇' },
  platinum: { bg: 'linear-gradient(135deg,#f3e8ff,#ede9fe)', color: '#5b21b6', border: '#ddd6fe', icon: '💎' },
};

const TierBadge = ({ tier }) => {
  const t = TIER[tier] || TIER.silver;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: t.bg, color: t.color, border: `1px solid ${t.border}`,
      borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {t.icon} {tier}
    </span>
  );
};

/* ── Export Dropdown ─────────────────────────────────────────────── */
const ExportDropdown = ({ onExport, exporting }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => !exporting && setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          height: '36px', padding: '0 14px',
          background: open ? '#f1f5f9' : 'white',
          border: `1.5px solid ${open ? '#c5cfe8' : 'var(--border)'}`,
          borderRadius: '8px', cursor: exporting ? 'not-allowed' : 'pointer',
          fontSize: '13px', fontWeight: 600, color: 'var(--text)',
          transition: 'all 0.15s', opacity: exporting ? 0.7 : 1,
          boxShadow: open ? '0 0 0 3px rgba(92,106,196,0.1)' : 'none',
        }}>
        {exporting ? (
          <>
            <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2, borderTopColor: 'var(--primary)', borderColor: '#ddd' }} />
            Exporting…
          </>
        ) : (
          <>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} style={{ opacity: 0.4, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)',
          background: 'white', border: '1px solid var(--border)',
          borderRadius: '10px', boxShadow: 'var(--shadow-lg)',
          minWidth: '200px', overflow: 'hidden', zIndex: 300,
          animation: 'fadeSlideUp 0.12s ease',
        }}>
          <div style={{ padding: '6px' }}>
            {[
              { format: 'csv', icon: '📊', label: 'Download CSV', sub: 'Spreadsheet format' },
              { format: 'pdf', icon: '📄', label: 'Download PDF',  sub: 'Print-ready document' },
            ].map(({ format, icon, label, sub }) => (
              <button key={format}
                onClick={() => { onExport(format); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                  padding: '9px 11px', borderRadius: '7px',
                  border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>{sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Date Range Popover ──────────────────────────────────────────── */
const DateRangeFilter = ({ appliedStart, appliedEnd, onApply }) => {
  const [open,  setOpen]  = useState(false);
  const [start, setStart] = useState(appliedStart);
  const [end,   setEnd]   = useState(appliedEnd);
  const ref = useRef(null);

  useEffect(() => { setStart(appliedStart); setEnd(appliedEnd); }, [appliedStart, appliedEnd]);

  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  const isActive   = appliedStart || appliedEnd;
  const handleApply = () => { onApply(start, end); setOpen(false); };
  const handleClear = () => { setStart(''); setEnd(''); onApply('', ''); setOpen(false); };

  const label = isActive
    ? [fmtShort(appliedStart), fmtShort(appliedEnd)].filter(Boolean).join(' – ')
    : 'Date Range';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          height: '36px', padding: '0 12px',
          background: isActive ? 'var(--primary-light)' : open ? '#f1f5f9' : 'white',
          border: `1.5px solid ${isActive ? 'var(--primary)' : open ? '#c5cfe8' : 'var(--border)'}`,
          borderRadius: '8px', cursor: 'pointer',
          fontSize: '13px', fontWeight: 600,
          color: isActive ? 'var(--primary)' : 'var(--text)',
          transition: 'all 0.15s', whiteSpace: 'nowrap',
          boxShadow: open && !isActive ? '0 0 0 3px rgba(92,106,196,0.1)' : 'none',
        }}>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8"  y1="2" x2="8"  y2="6" />
          <line x1="3"  y1="10" x2="21" y2="10" />
        </svg>
        {label}
        {isActive ? (
          <span
            onClick={e => { e.stopPropagation(); handleClear(); }}
            style={{ marginLeft: '1px', opacity: 0.55, fontSize: '15px', lineHeight: 1, fontWeight: 400 }}>
            ×
          </span>
        ) : (
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} style={{ opacity: 0.4, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', left: 0, top: 'calc(100% + 8px)',
          background: 'white', border: '1px solid var(--border)',
          borderRadius: '12px', boxShadow: 'var(--shadow-lg)',
          padding: '16px 16px 14px', zIndex: 300, minWidth: '300px',
          animation: 'fadeSlideUp 0.12s ease',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
            Filter by date
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            {[
              { label: 'From', val: start, set: setStart, max: end   || undefined, min: undefined },
              { label: 'To',   val: end,   set: setEnd,   min: start || undefined, max: undefined },
            ].map(({ label, val, set, min, max }) => (
              <div key={label}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '5px' }}>{label}</label>
                <input type="date" value={val} min={min} max={max}
                  onChange={e => set(e.target.value)}
                  className="form-input" style={{ fontSize: '13px', padding: '8px 10px' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <button onClick={handleClear}
              style={{ padding: '7px 14px', border: '1px solid var(--border)', borderRadius: '7px', background: 'white', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Clear
            </button>
            <button onClick={handleApply}
              style={{ padding: '7px 16px', border: 'none', borderRadius: '7px', background: 'var(--primary)', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Pagination button ───────────────────────────────────────────── */
const PagBtn = ({ label, onClick, disabled, active }) => (
  <button onClick={onClick} disabled={disabled}
    style={{
      padding: '5px 10px', borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer',
      border: active ? 'none' : '1px solid var(--border)',
      background: active ? 'var(--primary)' : disabled ? '#f8f9fb' : 'white',
      color: active ? 'white' : disabled ? '#bbb' : 'var(--text)',
      fontSize: '12px', fontWeight: 600, minWidth: '32px',
    }}>
    {label}
  </button>
);

/* ── Main component ──────────────────────────────────────────────── */
const LIMIT = 20;

export default function Customers() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canExport = hasPermission('customers', 'export');

  const [customers, setCustomers] = useState([]);
  const [meta,      setMeta]      = useState({ total: 0, page: 1, pages: 1 });
  const [loading,   setLoading]   = useState(true);
  const [exporting, setExporting] = useState('');

  const [search,    setSearch]    = useState('');
  const [tierFilter,setTier]      = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [page,      setPage]      = useState(1);

  /* ── Fetch ── */
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search)    params.search    = search;
      if (tierFilter) params.tier     = tierFilter;
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      const { data } = await axios.get('/api/customers', { params });
      setCustomers(data.data.customers || []);
      setMeta({ total: data.data.total, page: data.data.page, pages: data.data.pages });
    } catch {}
    setLoading(false);
  }, [page, search, tierFilter, startDate, endDate]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handle  = (setter) => (val) => { setter(val); setPage(1); };
  const handleDate = (s, e) => { setStartDate(s); setEndDate(e); setPage(1); };

  /* ── Export ── */
  const exportData = async (format) => {
    setExporting(format);
    try {
      const params = { format };
      if (tierFilter) params.tier     = tierFilter;
      if (startDate)  params.startDate = startDate;
      if (endDate)    params.endDate   = endDate;
      if (search)     params.search    = search;
      const res = await axios.get('/api/customers/export', { params, responseType: 'blob' });
      const mime = format === 'pdf' ? 'application/pdf' : 'text/csv';
      const url  = URL.createObjectURL(new Blob([res.data], { type: mime }));
      Object.assign(document.createElement('a'), { href: url, download: `customers.${format}` }).click();
      URL.revokeObjectURL(url);
    } catch {}
    setExporting('');
  };

  const hasFilter = search || tierFilter || startDate || endDate;

  /* ── Render ── */
  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">All enrolled loyalty program members</p>
        </div>

        {/* Tier chips + count */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {Object.entries(TIER).map(([tier, t]) => {
            const active = tierFilter === tier;
            return (
              <button key={tier} onClick={() => handle(setTier)(active ? '' : tier)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '5px 11px', borderRadius: '8px', cursor: 'pointer',
                  background: active ? t.bg : 'white',
                  border: `1.5px solid ${active ? t.border : 'var(--border)'}`,
                  fontSize: '12px', fontWeight: 600,
                  color: active ? t.color : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}>
                {t.icon} {tier}
                {active && <span style={{ opacity: 0.55, fontSize: '14px', lineHeight: 1 }}>×</span>}
              </button>
            );
          })}
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 14px', fontWeight: 500 }}>
            {meta.total.toLocaleString('en-IN')} members
          </div>
        </div>
      </div>

      <div className="card">
        {/* ── Toolbar ── */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '180px', maxWidth: '260px' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2.5}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="form-input"
              style={{ paddingLeft: '32px', height: '36px', fontSize: '13px' }}
              placeholder="Search name or email…"
              value={search}
              onChange={e => handle(setSearch)(e.target.value)}
            />
          </div>

          {/* Date range */}
          <DateRangeFilter appliedStart={startDate} appliedEnd={endDate} onApply={handleDate} />

          {/* Clear all */}
          {hasFilter && (
            <button onClick={() => { handle(setSearch)(''); handle(setTier)(''); handleDate('', ''); }}
              style={{ height: '36px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
              Clear all
            </button>
          )}

          {canExport && (
            <div style={{ marginLeft: 'auto' }}>
              <ExportDropdown onExport={exportData} exporting={exporting} />
            </div>
          )}
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div style={{ padding: '56px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ borderTopColor: 'var(--primary)', borderColor: '#e2e8f0', width: 30, height: 30, borderWidth: 3, margin: '0 auto 14px' }} />
            <div style={{ fontSize: '13px' }}>Loading customers…</div>
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>👥</div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>No customers found</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Try adjusting your search or date range</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Tier</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Birthday</th>
                  <th>Anniversary</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, idx) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/customers/${c.shopifyCustomerId}`)}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {(meta.page - 1) * LIMIT + idx + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary)' }}>{c.firstName} {c.lastName}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', fontFamily: 'monospace' }}>#{String(c.shopifyCustomerId).slice(-8)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{c.phone || '—'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{c.email || '—'}</div>
                    </td>
                    <td><TierBadge tier={c.currentTier} /></td>
                    <td style={{ fontWeight: 600, fontSize: '13px' }}>{c.ordersCount}</td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>₹{parseFloat(c.totalSpent || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.birthdayDate || '—'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.anniversaryDate || '—'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {fmtFull(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {meta.pages > 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Page {meta.page} of {meta.pages} · {meta.total.toLocaleString('en-IN')} customers
            </span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <PagBtn label="← Prev" disabled={page <= 1}          onClick={() => setPage(p => p - 1)} />
              {Array.from({ length: Math.min(meta.pages, 7) }, (_, i) => {
                const p = meta.pages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= meta.pages - 3 ? meta.pages - 6 + i : page - 3 + i;
                return <PagBtn key={p} label={p} active={p === page} onClick={() => setPage(p)} />;
              })}
              <PagBtn label="Next →" disabled={page >= meta.pages} onClick={() => setPage(p => p + 1)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
