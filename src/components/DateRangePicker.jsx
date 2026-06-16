import { useState, useRef, useEffect } from 'react';

const MONTHS = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
const WEEK_DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const toStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const todayStr = () => toStr(new Date());

const fmtDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
};

const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDay   = (y, m) => new Date(y, m, 1).getDay();

const subtractMonths = (y, m, n) => {
  const d = new Date(y, m - n, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
};

const presetDates = (key) => {
  const now = new Date();
  const end = toStr(now);
  if (key === 'today') return { start: end, end };
  const s = new Date(now);
  if (key === '1m')  s.setMonth(s.getMonth() - 1);
  if (key === '3m')  s.setMonth(s.getMonth() - 3);
  if (key === '6m')  s.setMonth(s.getMonth() - 6);
  return { start: toStr(s), end };
};

const PRESETS = [
  { key: 'today', label: 'Today'     },
  { key: '1m',    label: '1 Month'   },
  { key: '3m',    label: '3 Months'  },
  { key: '6m',    label: '6 Months'  },
  { key: 'custom',label: 'Custom'    },
];

/* ── Single month calendar ─────────────────────────────────────── */
function MonthCalendar({ year, month, selStart, selEnd, hoverDate, onDayClick, onDayEnter, onDayLeave, showPrev, showNext, onPrev, onNext }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDay(year, month);

  const buildGrid = () => {
    const grid = [];
    let week = new Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const mm  = String(month + 1).padStart(2, '0');
      const dd  = String(d).padStart(2, '0');
      week.push(`${year}-${mm}-${dd}`);
      if (week.length === 7) { grid.push(week); week = []; }
    }
    if (week.length) { while (week.length < 7) week.push(null); grid.push(week); }
    return grid;
  };

  const grid = buildGrid();
  const today = todayStr();
  const rangeEnd = selEnd || hoverDate;

  const getRange = () => {
    if (!selStart || !rangeEnd) return { s: null, e: null };
    return selStart <= rangeEnd
      ? { s: selStart, e: rangeEnd }
      : { s: rangeEnd, e: selStart };
  };

  const { s: rStart, e: rEnd } = getRange();

  const isStart    = (d) => d === selStart;
  const isEnd      = (d) => d === selEnd;
  const isInRange  = (d) => rStart && rEnd && d > rStart && d < rEnd;
  const isToday    = (d) => d === today;
  const isFuture   = (d) => d > today;
  const isSelected = (d) => isStart(d) || isEnd(d);
  const isSingleDay = selStart && selEnd && selStart === selEnd;

  return (
    <div style={{ flex: 1, padding: '0 20px 8px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        {showPrev ? (
          <button onClick={onPrev} style={navBtnStyle}>‹</button>
        ) : <div style={{ width: 28 }} />}

        <span style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>
          {MONTHS[month]} {year}
        </span>

        {showNext ? (
          <button onClick={onNext} style={navBtnStyle}>›</button>
        ) : <div style={{ width: 28 }} />}
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
        {WEEK_DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', fontWeight: 600, padding: '4px 0', letterSpacing: '0.3px' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      {grid.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {week.map((dateStr, di) => {
            if (!dateStr) return <div key={di} style={{ height: 36 }} />;

            const sel     = isSelected(dateStr);
            const inRange = isInRange(dateStr);
            const start   = isStart(dateStr);
            const end     = isEnd(dateStr);
            const tdayD   = isToday(dateStr);
            const future  = isFuture(dateStr);
            const single  = isSingleDay;

            // Range stripe background on the cell
            let cellBg = 'none';
            if (!single && inRange) cellBg = '#f3f4f6';
            if (!single && start && selEnd) cellBg = 'linear-gradient(to right, transparent 50%, #f3f4f6 50%)';
            if (!single && end   && selStart) cellBg = 'linear-gradient(to left, transparent 50%, #f3f4f6 50%)';

            return (
              <div key={di}
                style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cellBg }}>
                <div
                  onClick={() => !future && onDayClick(dateStr)}
                  onMouseEnter={() => onDayEnter(dateStr)}
                  onMouseLeave={onDayLeave}
                  style={{
                    width: 34, height: 34,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%',
                    background: sel ? '#111' : 'none',
                    color: sel ? 'white' : future ? '#d1d5db' : '#111',
                    fontSize: '14px',
                    fontWeight: sel || tdayD ? 700 : 400,
                    cursor: future ? 'default' : 'pointer',
                    boxShadow: tdayD && !sel ? 'inset 0 0 0 1.5px #111' : 'none',
                    transition: 'background 0.1s',
                    userSelect: 'none',
                  }}
                  onMouseOver={e => { if (!sel && !future) e.currentTarget.style.background = '#f3f4f6'; }}
                  onMouseOut={e =>  { if (!sel) e.currentTarget.style.background = 'none'; }}
                >
                  {parseInt(dateStr.split('-')[2], 10)}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const navBtnStyle = {
  width: 28, height: 28,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'none', border: '1px solid #e5e7eb',
  borderRadius: '6px', cursor: 'pointer',
  fontSize: '18px', color: '#374151', lineHeight: 1,
  padding: 0,
};

/* ── Main component ─────────────────────────────────────────────── */
export default function DateRangePicker({ activePreset, appliedStart, appliedEnd, onApply }) {
  const [open,      setOpen]      = useState(false);
  const [selStart,  setSelStart]  = useState(appliedStart || '');
  const [selEnd,    setSelEnd]    = useState(appliedEnd   || '');
  const [hoverDate, setHoverDate] = useState('');
  const [preset,    setPreset]    = useState(activePreset || '');

  // Right calendar defaults to current month
  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // right calendar month

  const ref = useRef(null);

  // Sync when parent clears filter
  useEffect(() => {
    setSelStart(appliedStart || '');
    setSelEnd(appliedEnd     || '');
    setPreset(activePreset   || '');
  }, [appliedStart, appliedEnd, activePreset]);

  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  // Left calendar = one month before right
  const left  = subtractMonths(viewYear, viewMonth, 1);
  const right = { year: viewYear, month: viewMonth };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (dateStr) => {
    if (!selStart || (selStart && selEnd)) {
      setSelStart(dateStr);
      setSelEnd('');
      setPreset('custom');
    } else {
      if (dateStr < selStart) {
        setSelEnd(selStart);
        setSelStart(dateStr);
      } else if (dateStr === selStart) {
        setSelEnd(dateStr);
      } else {
        setSelEnd(dateStr);
      }
      setPreset('custom');
    }
  };

  const handlePreset = (key) => {
    setPreset(key);
    if (key === 'custom') return;
    const { start, end } = presetDates(key);
    setSelStart(start);
    setSelEnd(end);
    // Navigate right calendar to show end month
    const endDate = new Date(end);
    setViewYear(endDate.getFullYear());
    setViewMonth(endDate.getMonth());
  };

  const handleApply = () => {
    onApply(selStart, selEnd, preset);
    setOpen(false);
  };

  const handleCancel = () => {
    setSelStart(appliedStart || '');
    setSelEnd(appliedEnd     || '');
    setPreset(activePreset   || '');
    setOpen(false);
  };

  const canApply = !!(selStart && selEnd);
  const isActive = !!(appliedStart || appliedEnd);

  // Button label
  const btnLabel = isActive
    ? [fmtDisplay(appliedStart), fmtDisplay(appliedEnd)].filter(Boolean).join(' – ')
    : null;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          height: '36px', padding: '0 14px',
          background: isActive ? 'var(--primary)' : open ? '#f1f5f9' : 'white',
          border: `1.5px solid ${isActive ? 'var(--primary)' : open ? '#c5cfe8' : 'var(--border)'}`,
          borderRadius: '8px', cursor: 'pointer',
          fontSize: '13px', fontWeight: 600,
          color: isActive ? 'white' : 'var(--text)',
          transition: 'all 0.15s', whiteSpace: 'nowrap',
          boxShadow: open && !isActive ? '0 0 0 3px rgba(92,106,196,0.1)' : 'none',
        }}>
        {/* Filter icon */}
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
        </svg>
        {btnLabel || 'Filter'}
        {isActive ? (
          <span
            onClick={e => { e.stopPropagation(); onApply('', '', ''); }}
            style={{ marginLeft: '1px', opacity: 0.75, fontSize: '16px', lineHeight: 1, fontWeight: 400 }}>
            ×
          </span>
        ) : (
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
            style={{ opacity: 0.4, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div style={{
          position: 'absolute', left: 0, top: 'calc(100% + 8px)',
          background: 'white', borderRadius: '12px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          border: '1px solid #e5e7eb',
          display: 'flex', flexDirection: 'column',
          zIndex: 500, overflow: 'hidden', minWidth: '740px',
          animation: 'fadeSlideUp 0.12s ease',
        }}>

          <div style={{ display: 'flex' }}>
            {/* ── LEFT: Presets ── */}
            <div style={{ width: '170px', flexShrink: 0, borderRight: '1px solid #e5e7eb', background: '#fafafa', padding: '8px 0' }}>
              {PRESETS.map(({ key, label }) => {
                const active = preset === key;
                return (
                  <button key={key} onClick={() => handlePreset(key)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '11px 20px', border: 'none', cursor: 'pointer',
                      background: active ? '#f3f4f6' : 'none',
                      color: active ? '#111' : '#374151',
                      fontSize: '14px', fontWeight: active ? 700 : 400,
                      borderLeft: `3px solid ${active ? '#111' : 'transparent'}`,
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f3f4f6'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none'; }}>
                    {label}
                  </button>
                );
              })}
            </div>

            {/* ── RIGHT: Calendar area ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Date inputs */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  flex: 1, border: '1px solid #d1d5db', borderRadius: '8px',
                  padding: '8px 14px', fontSize: '14px',
                  color: selStart ? '#111' : '#9ca3af',
                }}>
                  {selStart ? fmtDisplay(selStart) : 'Start date'}
                </div>

                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>

                <div style={{
                  flex: 1, border: '1px solid #d1d5db', borderRadius: '8px',
                  padding: '8px 14px', fontSize: '14px',
                  color: selEnd ? '#111' : '#9ca3af',
                }}>
                  {selEnd ? fmtDisplay(selEnd) : 'End date'}
                </div>
              </div>

              {/* Two calendars */}
              <div style={{ display: 'flex', padding: '16px 0 8px' }}>
                <MonthCalendar
                  year={left.year} month={left.month}
                  selStart={selStart} selEnd={selEnd} hoverDate={hoverDate}
                  onDayClick={handleDayClick}
                  onDayEnter={(d) => { if (selStart && !selEnd) setHoverDate(d); }}
                  onDayLeave={() => setHoverDate('')}
                  showPrev={true} showNext={false}
                  onPrev={prevMonth} onNext={nextMonth}
                />
                <div style={{ width: '1px', background: '#e5e7eb', margin: '0 0 8px' }} />
                <MonthCalendar
                  year={right.year} month={right.month}
                  selStart={selStart} selEnd={selEnd} hoverDate={hoverDate}
                  onDayClick={handleDayClick}
                  onDayEnter={(d) => { if (selStart && !selEnd) setHoverDate(d); }}
                  onDayLeave={() => setHoverDate('')}
                  showPrev={false} showNext={true}
                  onPrev={prevMonth} onNext={nextMonth}
                />
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: '12px 20px', borderTop: '1px solid #e5e7eb',
            display: 'flex', justifyContent: 'flex-end', gap: '10px',
            background: 'white',
          }}>
            <button onClick={handleCancel}
              style={{
                padding: '8px 22px', border: '1px solid #d1d5db',
                borderRadius: '8px', background: 'white',
                color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>
              Cancel
            </button>
            <button onClick={handleApply} disabled={!canApply}
              style={{
                padding: '8px 22px', border: 'none',
                borderRadius: '8px',
                background: canApply ? '#111' : '#e5e7eb',
                color: canApply ? 'white' : '#9ca3af',
                fontSize: '13px', fontWeight: 700,
                cursor: canApply ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
