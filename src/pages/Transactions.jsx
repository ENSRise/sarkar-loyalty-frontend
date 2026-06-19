import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DateRangePicker from '../components/DateRangePicker';

/* ── Helpers ─────────────────────────────────────────────────────── */
const fmtFull = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ── Status config ───────────────────────────────────────────────── */
const STATUS = {
  Hold:   { bg: '#fef9c3', color: '#854d0e', border: '#fde047', dot: '#ca8a04' },
  Cancel: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', dot: '#ef4444' },
  Credit: { bg: '#dcfce7', color: '#166534', border: '#86efac', dot: '#22c55e' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS[status] || STATUS.Hold;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {status}
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
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} style={{ opacity: 0.45, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}>
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

/* ── Order detail modal ──────────────────────────────────────────── */
const OrderModal = ({ order, onClose }) => {
  if (!order) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px', backdropFilter: 'blur(2px)',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '16px', width: '100%', maxWidth: '640px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e3e8ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'white', zIndex: 1, borderRadius: '16px 16px 0 0' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text)' }}>{order.orderName || `Order #${order.orderId?.slice(-6)}`}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', fontFamily: 'monospace' }}>{order.orderId}</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <StatusBadge status={order.orderStatus} />
            <button onClick={onClose} style={{ width: 32, height: 32, background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#697386', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ModalSection title="Customer">
            <ModalGrid>
              <ModalInfo label="Name"       value={order.customerName || '—'} />
              <ModalInfo label="Email"      value={order.customerEmail || '—'} />
              <ModalInfo label="Phone"      value={order.customerPhone || '—'} />
              <ModalInfo label="Shopify ID" value={order.shopifyCustomerId || '—'} />
            </ModalGrid>
          </ModalSection>

          <ModalSection title="Financials">
            <ModalGrid>
              <ModalInfo label="Total Price"   value={`₹${parseFloat(order.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} strong />
              <ModalInfo label="Tax"           value={`₹${order.totalTax}`} />
              <ModalInfo label="Discounts"     value={`₹${order.totalDiscounts}`} />
              {order.couponCode && (
                <ModalInfo label="Coupon Used" value={`${order.couponCode} (−₹${parseFloat(order.couponAmount || 0).toLocaleString('en-IN')})`} strong />
              )}
              <ModalInfo label="Return Window" value={`${order.returnWindow} days`} />
              <ModalInfo label="Credit Day"    value={order.creditDay || '—'} />
              <ModalInfo label="Created"       value={fmtFull(order.createdAt)} />
            </ModalGrid>
          </ModalSection>

          <ModalSection title={`Items (${(order.orderItems || []).length})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(order.orderItems || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fb', borderRadius: '8px', padding: '10px 14px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.name}</div>
                    {item.sku && <div style={{ fontSize: '11px', color: '#697386' }}>SKU: {item.sku}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>₹{item.price}</div>
                    <div style={{ fontSize: '11px', color: '#697386' }}>Qty: {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          </ModalSection>

          {order.shippingLines?.length > 0 && (
            <ModalSection title="Shipping">
              {order.shippingLines.map((s, i) => (
                <div key={i} style={{ fontSize: '13px', color: '#697386' }}>{s.title} — ₹{s.price}</div>
              ))}
            </ModalSection>
          )}
        </div>
      </div>
    </div>
  );
};

const ModalSection = ({ title, children }) => (
  <div>
    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>{title}</div>
    {children}
  </div>
);
const ModalGrid = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>{children}</div>
);
const ModalInfo = ({ label, value, strong }) => (
  <div style={{ background: '#f8f9fb', borderRadius: '8px', padding: '10px 12px' }}>
    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{label}</div>
    <div style={{ fontSize: '13px', fontWeight: strong ? 700 : 500, color: 'var(--text)', wordBreak: 'break-all' }}>{value}</div>
  </div>
);

/* ── Main component ──────────────────────────────────────────────── */
export default function Transactions() {
  const { hasPermission } = useAuth();
  const canExport = hasPermission('transactions', 'export');

  const [orders,   setOrders]   = useState([]);
  const [meta,     setMeta]     = useState({ total: 0, page: 1, pages: 1 });
  const [loading,  setLoading]  = useState(true);
  const [exporting,setExporting]= useState('');
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatus]       = useState('');
  const [startDate,    setStartDate]    = useState('');
  const [endDate,      setEndDate]      = useState('');
  const [activePreset, setActivePreset] = useState('');
  const [page,         setPage]         = useState(1);
  const [selected,     setSelected]     = useState(null);

  const LIMIT = 15;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search)       params.search    = search;
      if (statusFilter) params.status    = statusFilter;
      if (startDate)    params.startDate = startDate;
      if (endDate)      params.endDate   = endDate;
      const { data } = await axios.get('/api/orders', { params });
      setOrders(data.data.orders || []);
      setMeta({ total: data.data.total, page: data.data.page, pages: data.data.pages });
    } catch {}
    setLoading(false);
  }, [page, search, statusFilter, startDate, endDate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleSearch = (v) => { setSearch(v); setPage(1); };
  const handleStatus = (v) => { setStatus(v); setPage(1); };
  const handleDate   = (s, e, preset = '') => { setStartDate(s); setEndDate(e); setActivePreset(preset); setPage(1); };

  const exportData = async (format) => {
    setExporting(format);
    try {
      const params = { format };
      if (statusFilter) params.status    = statusFilter;
      if (startDate)    params.startDate = startDate;
      if (endDate)      params.endDate   = endDate;
      if (search)       params.search    = search;
      const res = await axios.get('/api/orders/export', { params, responseType: 'blob' });
      const mime = format === 'pdf' ? 'application/pdf' : 'text/csv';
      const url  = URL.createObjectURL(new Blob([res.data], { type: mime }));
      Object.assign(document.createElement('a'), { href: url, download: `orders.${format}` }).click();
      URL.revokeObjectURL(url);
    } catch {}
    setExporting('');
  };

  const hasFilter = search || statusFilter || startDate || endDate || activePreset;

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">All Shopify orders with live status tracking</p>
        </div>

        {/* Status chips + total count */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {Object.entries(STATUS).map(([status, s]) => {
            const active = statusFilter === status;
            return (
              <button key={status} onClick={() => handleStatus(active ? '' : status)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                  background: active ? s.bg : 'white',
                  border: `1.5px solid ${active ? s.border : 'var(--border)'}`,
                  fontSize: '12px', fontWeight: 600,
                  color: active ? s.color : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot }} />
                {status}
                {active && <span style={{ opacity: 0.55, fontSize: '14px', lineHeight: 1 }}>×</span>}
              </button>
            );
          })}
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 14px', fontWeight: 500 }}>
            {meta.total.toLocaleString('en-IN')} orders
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
              placeholder="Search orders…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>

          {/* Date filter */}
          <DateRangePicker
            activePreset={activePreset}
            appliedStart={startDate}
            appliedEnd={endDate}
            onApply={handleDate}
          />

          {/* Clear all */}
          {hasFilter && (
            <button onClick={() => { handleSearch(''); handleStatus(''); handleDate('', '', ''); }}
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
            <div style={{ fontSize: '13px' }}>Loading orders…</div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>No orders found</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Try adjusting your search or date range</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Credit Day</th>
                  <th>Date</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(o)}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {(meta.page - 1) * LIMIT + idx + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>{o.orderName || `#${o.orderId?.slice(-6)}`}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'monospace' }}>{o.orderId?.slice(-12)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{o.customerName || '—'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{o.customerPhone || o.customerEmail || ''}</div>
                    </td>
                    <td style={{ maxWidth: '160px' }}>
                      {(o.orderItems || []).slice(0, 2).map((item, i) => (
                        <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.quantity}× {item.name}
                        </div>
                      ))}
                      {(o.orderItems || []).length > 2 && (
                        <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, marginTop: '1px' }}>+{o.orderItems.length - 2} more</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>₹{parseFloat(o.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      {o.couponCode ? (
                        <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginTop: '1px', fontFamily: 'monospace' }}>
                          {o.couponCode} −₹{o.couponAmount}
                        </div>
                      ) : parseFloat(o.totalDiscounts) > 0 && (
                        <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginTop: '1px' }}>−₹{o.totalDiscounts} off</div>
                      )}
                    </td>
                    <td><StatusBadge status={o.orderStatus} /></td>
                    <td style={{ fontSize: '12px', color: o.creditDay ? 'var(--text)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {o.creditDay || '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {fmtFull(o.createdAt)}
                    </td>
                    <td>
                      <button onClick={e => { e.stopPropagation(); setSelected(o); }}
                        style={{ background: 'var(--primary-light)', border: 'none', borderRadius: '6px', padding: '5px 11px', cursor: 'pointer', color: 'var(--primary)', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        View
                      </button>
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
              Page {meta.page} of {meta.pages} · {meta.total.toLocaleString('en-IN')} orders
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

      <OrderModal order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
