import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DateRangePicker from '../components/DateRangePicker';

/* ── Helpers ─────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

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
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
              style={{ opacity: 0.4, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}>
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
              { format: 'xlsx', icon: '📊', label: 'Download Excel (.xlsx)', sub: 'Full detail — all fields' },
              { format: 'pdf',  icon: '📄', label: 'Download PDF',           sub: 'Print-ready document'    },
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

/* ── Pagination Button ───────────────────────────────────────────── */
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

export default function InterestedCustomers() {
  const { hasPermission } = useAuth();
  const canExport = hasPermission('interested_customers', 'export');

  const [customers,   setCustomers]   = useState([]);
  const [meta,        setMeta]        = useState({ total: 0, page: 1, pages: 1 });
  const [loading,     setLoading]     = useState(true);
  const [exporting,   setExporting]   = useState('');

  const [search,       setSearch]      = useState('');
  const [startDate,    setStartDate]   = useState('');
  const [endDate,      setEndDate]     = useState('');
  const [activePreset, setActivePreset]= useState('');
  const [page,         setPage]        = useState(1);

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search)    params.search    = search;
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      const { data } = await axios.get('/api/interested-customers', { params });
      setCustomers(data.data?.customers || []);
      setMeta({
        total: data.data?.total  || 0,
        page:  data.data?.page   || 1,
        pages: data.data?.pages  || 1,
      });
    } catch (err) {
      console.error('Failed to fetch interested customers:', err);
    }
    setLoading(false);
  }, [page, search, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handle     = (setter) => (val) => { setter(val); setPage(1); };
  const handleDate = (s, e, preset = '') => { setStartDate(s); setEndDate(e); setActivePreset(preset); setPage(1); };

  /* ── Export ── */
  const exportData = async (format) => {
    setExporting(format);
    try {
      const params = { format };
      if (search)    params.search    = search;
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      const res = await axios.get('/api/interested-customers/export', { params, responseType: 'blob' });
      const mime = format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const url = URL.createObjectURL(new Blob([res.data], { type: mime }));
      Object.assign(document.createElement('a'), { href: url, download: `interested-customers.${format}` }).click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting('');
  };

  const hasFilter = search || startDate || endDate || activePreset;

  /* ── Render ── */
  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Interested Customers</h1>
          <p className="page-subtitle">Visitors who filled the form but haven't joined yet</p>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'white', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '8px 16px',
        }}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Total Interested
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
              {meta.total.toLocaleString('en-IN')}
            </div>
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
              placeholder="Search name, email or phone…"
              value={search}
              onChange={e => handle(setSearch)(e.target.value)}
            />
          </div>

          {/* Date range filter */}
          <DateRangePicker
            activePreset={activePreset}
            appliedStart={startDate}
            appliedEnd={endDate}
            onApply={handleDate}
          />

          {/* Clear all */}
          {hasFilter && (
            <button onClick={() => { handle(setSearch)(''); handleDate('', '', ''); }}
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
            <div style={{ fontSize: '13px' }}>Loading…</div>
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎯</div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>No interested customers found</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {hasFilter ? 'Try adjusting your search or date range.' : 'Customers who fill the form but don\'t submit will appear here.'}
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>Birthday</th>
                  <th>Anniversary</th>
                  <th>Captured At</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, idx) => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {(meta.page - 1) * LIMIT + idx + 1}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: '#0369a1',
                        }}>
                          {(c.firstName || '?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>
                          {[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{c.email || '—'}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {c.phone || '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {fmtDate(c.birthdayDate)}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {fmtDate(c.anniversaryDate)}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {fmtDateTime(c.createdAt)}
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
              Page {meta.page} of {meta.pages} · {meta.total.toLocaleString('en-IN')} records
            </span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <PagBtn label="← Prev" disabled={page <= 1}           onClick={() => setPage(p => p - 1)} />
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
