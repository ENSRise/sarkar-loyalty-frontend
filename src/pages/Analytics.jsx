import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector,
  ComposedChart, ReferenceLine,
} from 'recharts';

const SHOP = 'loyalty-rgck8aw4.myshopify.com';

/* ── Colours ─────────────────────────────────────────────────── */
const C = { Hold: '#f59e0b', Cancel: '#ef4444', Credit: '#22c55e', Total: '#5c6ac4' };
const PIE_COLORS = [C.Hold, C.Credit, C.Cancel];

const TIER_CFG = {
  silver: {
    label: 'Silver', icon: '🥈',
    color: '#718096', colorLight: '#a0aec0', bg: '#f5f7fa',
    gradient: 'linear-gradient(135deg, #4a5568, #a0aec0)',
    pieCols: ['#a0aec0', '#718096', '#4a5568', '#2d3748'],
  },
  gold: {
    label: 'Gold', icon: '🥇',
    color: '#c9890a', colorLight: '#e8b84b', bg: '#fffbf0',
    gradient: 'linear-gradient(135deg, #8b5e00, #e8b84b)',
    pieCols: ['#e8b84b', '#c9890a', '#8b5e00', '#5a3a00'],
  },
  platinum: {
    label: 'Platinum', icon: '💎',
    color: '#7b1fa2', colorLight: '#ce93d8', bg: '#fdf4ff',
    gradient: 'linear-gradient(135deg, #4a1e8a, #ce93d8)',
    pieCols: ['#ce93d8', '#ab47bc', '#7b1fa2', '#4a148c'],
  },
};

/* ── Helpers ─────────────────────────────────────────────────── */
const fmtRs = n => `₹${parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtN  = n => parseInt(n || 0).toLocaleString('en-IN');
const fmt$  = n => `$${parseFloat(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

/* ── Shared sub-components ───────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, useRs }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'white', fontSize: 13, fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill || p.color }} />
          {p.name}: {useRs ? fmtRs(p.value) : fmtN(p.value)}
        </div>
      ))}
    </div>
  );
};

const ChartCard = ({ title, subtitle, children }) => (
  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e3e8ef', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
    <div style={{ padding: '18px 22px', borderBottom: '1px solid #f0f2f5' }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#697386', marginTop: 2 }}>{subtitle}</div>}
    </div>
    <div style={{ padding: '20px 16px' }}>{children}</div>
  </div>
);

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#1a1a1a" fontSize={20} fontWeight={800}>{fmtN(value)}</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill="#697386" fontSize={12}>{payload.name}</text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill={fill} fontSize={12} fontWeight={700}>{(percent * 100).toFixed(1)}%</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={innerRadius - 1} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

/* ── KPI card for overview ───────────────────────────────────── */
const KpiCard = ({ label, count, revenue, color, icon }) => (
  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e3e8ef', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>{fmtN(count)}</div>
        <div style={{ fontSize: 12, color: '#697386', marginTop: 4 }}>orders</div>
      </div>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
    </div>
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0f2f5' }}>
      <div style={{ fontSize: 11, color: '#697386', marginBottom: 2 }}>Total Revenue</div>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{fmt$(revenue)}</div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   OVERVIEW (existing order analytics)
═══════════════════════════════════════════════════════════════ */
function OverviewSection() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePie, setActivePie] = useState(0);

  useEffect(() => {
    axios.get('/api/orders/analytics')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!stats) return <div style={{ color: '#697386', padding: 32 }}>Failed to load analytics.</div>;

  const { Hold, Cancel, Credit, total } = stats;

  const barData = [
    { name: 'Hold',   count: Hold.count,   revenue: Hold.revenue,   fill: C.Hold },
    { name: 'Credit', count: Credit.count, revenue: Credit.revenue, fill: C.Credit },
    { name: 'Cancel', count: Cancel.count, revenue: Cancel.revenue, fill: C.Cancel },
  ];
  const pieData = [
    { name: 'Hold',   value: Hold.count },
    { name: 'Credit', value: Credit.count },
    { name: 'Cancel', value: Cancel.count },
  ];
  const netRevenue = Credit.revenue - Cancel.revenue;
  const waterfallData = [
    { name: 'Potential\nRevenue', base: 0,               value: total.revenue,  fill: C.Total },
    { name: 'Credited',           base: 0,               value: Credit.revenue, fill: C.Credit },
    { name: 'On Hold',            base: Credit.revenue,  value: Hold.revenue,   fill: C.Hold },
    { name: 'Cancelled',          base: -Cancel.revenue, value: Cancel.revenue, fill: C.Cancel },
    { name: 'Net\nRevenue',       base: 0,               value: netRevenue,     fill: netRevenue >= 0 ? C.Total : C.Cancel },
  ];

  return (
    <div style={{ animation: 'fadeSlideUp 0.25s ease' }}>
      <SectionHeader title="Order Analytics" subtitle="Revenue, order distribution and performance breakdown" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Orders" count={total.count}   revenue={total.revenue}   color={C.Total}  icon="📦" />
        <KpiCard label="On Hold"      count={Hold.count}    revenue={Hold.revenue}    color={C.Hold}   icon="⏳" />
        <KpiCard label="Credited"     count={Credit.count}  revenue={Credit.revenue}  color={C.Credit} icon="✅" />
        <KpiCard label="Cancelled"    count={Cancel.count}  revenue={Cancel.revenue}  color={C.Cancel} icon="❌" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>
        <ChartCard title="Revenue by Status" subtitle="Order count and revenue per status">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barCategoryGap="35%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#697386' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#697386' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#697386' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(92,106,196,0.06)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left"  dataKey="revenue" name="Revenue" radius={[6,6,0,0]}>
                {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
              <Bar yAxisId="right" dataKey="count"   name="Count"   radius={[6,6,0,0]} fill="#e0e4f7" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order Distribution" subtitle="Share by order count">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={68} outerRadius={100}
                dataKey="value" activeIndex={activePie} activeShape={renderActiveShape}
                onMouseEnter={(_, i) => setActivePie(i)}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} stroke="white" strokeWidth={2} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#697386' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i] }} />
                {d.name}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Revenue Waterfall" subtitle="How total potential revenue flows into each status">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={waterfallData} barCategoryGap="40%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#697386' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#697386' }} axisLine={false} tickLine={false}
              tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const val = payload.find(p => p.dataKey === 'value');
              if (!val) return null;
              return (
                <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}>{label?.replace('\n', ' ')}</div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{fmt$(val.value)}</div>
                </div>
              );
            }} cursor={{ fill: 'rgba(92,106,196,0.06)' }} />
            <Bar dataKey="base"  stackId="w" fill="transparent" radius={0} />
            <Bar dataKey="value" stackId="w" radius={[6,6,0,0]}
              label={{ position: 'top', fontSize: 11, fill: '#697386', formatter: v => fmt$(v) }}>
              {waterfallData.map((e, i) => <Cell key={i} fill={e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
          {[['Potential Revenue', C.Total], ['Credited', C.Credit], ['On Hold', C.Hold], ['Cancelled', C.Cancel]].map(([name, color]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#697386' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
              {name}
            </div>
          ))}
        </div>
      </ChartCard>

      <div style={{ marginTop: 20 }}>
        <ChartCard title="Summary Table" subtitle="Quick reference of all status metrics">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Status', 'Orders', 'Total Revenue', 'Avg. Order Value', '% of Total'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', background: '#f8f9fb', color: '#697386', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e3e8ef' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { status: 'Hold',   data: Hold,   icon: '⏳', color: C.Hold },
                { status: 'Credit', data: Credit, icon: '✅', color: C.Credit },
                { status: 'Cancel', data: Cancel, icon: '❌', color: C.Cancel },
                { status: 'Total',  data: total,  icon: '📦', color: C.Total },
              ].map(({ status, data, icon, color }, i, arr) => (
                <tr key={status} style={{ borderTop: i === arr.length - 1 ? '2px solid #e3e8ef' : '1px solid #f0f2f5', fontWeight: i === arr.length - 1 ? 700 : 400 }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                      {icon} {status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{fmtN(data.count)}</td>
                  <td style={{ padding: '12px 16px', color }}>{fmt$(data.revenue)}</td>
                  <td style={{ padding: '12px 16px' }}>{data.count > 0 ? fmt$(data.revenue / data.count) : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{total.count > 0 ? ((data.count / total.count) * 100).toFixed(1) + '%' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TIER ANALYTICS SECTION
═══════════════════════════════════════════════════════════════ */
function TierSection({ tier }) {
  const navigate = useNavigate();
  const cfg = TIER_CFG[tier];
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activePie, setActivePie] = useState(0);
  const [activeSpendPie, setActiveSpendPie] = useState(0);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/customers', { params: { shopName: SHOP, tier, limit: 10000 } })
      .then(r => setCustomers(r.data.data?.customers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tier]);

  if (loading) return <Spinner />;

  /* ── Derived metrics ── */
  const totalCustomers = customers.length;
  const totalSpent     = customers.reduce((s, c) => s + parseFloat(c.totalSpent || 0), 0);
  const totalOrders    = customers.reduce((s, c) => s + parseInt(c.ordersCount || 0), 0);
  const avgSpent       = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
  const avgOrders      = totalCustomers > 0 ? totalOrders / totalCustomers : 0;

  /* Top 10 by spend for bar chart */
  const top10 = [...customers]
    .sort((a, b) => parseFloat(b.totalSpent || 0) - parseFloat(a.totalSpent || 0))
    .slice(0, 10)
    .map(c => ({
      name: `${c.firstName || ''} ${(c.lastName || '').charAt(0)}.`.trim(),
      spent: parseFloat(c.totalSpent || 0),
      orders: parseInt(c.ordersCount || 0),
      id: c.shopifyCustomerId,
    }));

  /* Orders count distribution for pie chart */
  const ordBuckets = { '0 orders': 0, '1–5': 0, '6–15': 0, '16+': 0 };
  customers.forEach(c => {
    const n = parseInt(c.ordersCount || 0);
    if (n === 0)       ordBuckets['0 orders']++;
    else if (n <= 5)   ordBuckets['1–5']++;
    else if (n <= 15)  ordBuckets['6–15']++;
    else               ordBuckets['16+']++;
  });
  const ordPieData = Object.entries(ordBuckets)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0);

  /* Spend range distribution */
  const spendBuckets = { '₹0': 0, '₹1–999': 0, '₹1k–4.9k': 0, '₹5k–9.9k': 0, '₹10k+': 0 };
  customers.forEach(c => {
    const s = parseFloat(c.totalSpent || 0);
    if (s === 0)          spendBuckets['₹0']++;
    else if (s < 1000)    spendBuckets['₹1–999']++;
    else if (s < 5000)    spendBuckets['₹1k–4.9k']++;
    else if (s < 10000)   spendBuckets['₹5k–9.9k']++;
    else                  spendBuckets['₹10k+']++;
  });
  const spendPieData = Object.entries(spendBuckets)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0);

  return (
    <div style={{ animation: 'fadeSlideUp 0.25s ease' }}>
      <SectionHeader
        title={`${cfg.icon} ${cfg.label} Tier Analytics`}
        subtitle={`Deep-dive into ${cfg.label} loyalty members`}
        accent={cfg.gradient}
      />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Members',       value: fmtN(totalCustomers), icon: '👥', sub: `${cfg.label} tier` },
          { label: 'Total Spend',   value: fmtRs(totalSpent),    icon: '💰', sub: 'all members' },
          { label: 'Avg. Spend',    value: fmtRs(avgSpent),      icon: '📊', sub: 'per member' },
          { label: 'Total Orders',  value: fmtN(totalOrders),    icon: '🛒', sub: 'credited' },
          { label: 'Avg. Orders',   value: avgOrders.toFixed(1), icon: '📦', sub: 'per member' },
        ].map(k => (
          <div key={k.label} style={{
            background: 'white', borderRadius: 12, border: '1px solid #e3e8ef',
            padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: cfg.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 10 }}>{k.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#697386', textTransform: 'uppercase', letterSpacing: 0.6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginTop: 4, letterSpacing: -0.3 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {totalCustomers === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e3e8ef', padding: '60px 32px', textAlign: 'center', color: '#697386' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{cfg.icon}</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No {cfg.label} members yet</div>
          <div style={{ fontSize: 13 }}>Customers will appear here once they reach the {cfg.label} tier.</div>
        </div>
      ) : (
        <>
          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

            {/* Pie — order count distribution */}
            <ChartCard title="Order Count Distribution" subtitle="How many orders each member has made">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={ordPieData} cx="50%" cy="50%" innerRadius={68} outerRadius={100}
                    dataKey="value" activeIndex={activePie} activeShape={renderActiveShape}
                    onMouseEnter={(_, i) => setActivePie(i)}>
                    {ordPieData.map((_, i) => <Cell key={i} fill={cfg.pieCols[i % cfg.pieCols.length]} stroke="white" strokeWidth={2} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                {ordPieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#697386' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.pieCols[i % cfg.pieCols.length] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Pie — spend range distribution */}
            <ChartCard title="Spend Range Distribution" subtitle="Members grouped by total spend bracket">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={spendPieData} cx="50%" cy="50%" innerRadius={68} outerRadius={100}
                    dataKey="value" activeIndex={activeSpendPie} activeShape={renderActiveShape}
                    onMouseEnter={(_, i) => setActiveSpendPie(i)}>
                    {spendPieData.map((_, i) => <Cell key={i} fill={cfg.pieCols[i % cfg.pieCols.length]} stroke="white" strokeWidth={2} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                {spendPieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#697386' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.pieCols[i % cfg.pieCols.length] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          {/* Bar chart — top 10 spenders */}
          {top10.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <ChartCard title={`Top ${top10.length} Members by Spend`} subtitle="Highest-spending loyalty members in this tier">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={top10} layout="vertical" barCategoryGap="22%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#697386' }} axisLine={false} tickLine={false}
                      tickFormatter={v => fmtRs(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#697386' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<CustomTooltip useRs />} cursor={{ fill: 'rgba(92,106,196,0.05)' }} />
                    <Bar dataKey="spent" name="Total Spent" radius={[0,6,6,0]}>
                      {top10.map((_, i) => (
                        <Cell key={i} fill={cfg.pieCols[Math.min(i, cfg.pieCols.length - 1)]}
                          fillOpacity={1 - i * 0.06} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* Members table */}
          <ChartCard title={`All ${cfg.label} Members`} subtitle={`${totalCustomers} member${totalCustomers !== 1 ? 's' : ''} in this tier`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Member', 'Phone', 'Email', 'Total Spent', 'Orders', 'Birthday'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', background: '#f8f9fb', color: '#697386', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e3e8ef', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...customers]
                    .sort((a, b) => parseFloat(b.totalSpent || 0) - parseFloat(a.totalSpent || 0))
                    .map(c => (
                      <tr key={c.id}
                        style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                        onClick={() => navigate(`/customers/${c.shopifyCustomerId}`)}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8faff'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{c.firstName} {c.lastName}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>#{String(c.shopifyCustomerId).slice(-6)}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#697386' }}>{c.phone || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#697386', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email || '—'}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: cfg.color }}>{fmtRs(c.totalSpent)}</td>
                        <td style={{ padding: '12px 16px', color: '#697386' }}>{c.ordersCount || 0}</td>
                        <td style={{ padding: '12px 16px', color: '#697386' }}>{c.birthdayDate || '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}

/* ── Shared helpers ──────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', flexDirection: 'column', gap: 12, color: '#697386' }}>
      <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, borderColor: '#e3e8ef', borderTopColor: 'var(--primary)' }} />
      Loading…
    </div>
  );
}

function SectionHeader({ title, subtitle, accent }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {accent && (
        <div style={{ width: 32, height: 3, background: accent, borderRadius: 2, marginBottom: 10 }} />
      )}
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', letterSpacing: -0.3 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: '#697386', marginTop: 4 }}>{subtitle}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT — sub-sidebar + content
═══════════════════════════════════════════════════════════════ */
const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview',  icon: '📊', desc: 'All orders' },
  { id: 'silver',    label: 'Silver',    icon: '🥈', desc: 'Members' },
  { id: 'gold',      label: 'Gold',      icon: '🥇', desc: 'Members' },
  { id: 'platinum',  label: 'Platinum',  icon: '💎', desc: 'Members' },
];

export default function Analytics() {
  const [active, setActive] = useState('overview');
  const [customerCounts, setCustomerCounts] = useState({});

  // Pre-fetch tier counts for sub-sidebar badges
  useEffect(() => {
    ['silver', 'gold', 'platinum'].forEach(tier => {
      axios.get('/api/customers', { params: { shopName: SHOP, tier, limit: 1 } })
        .then(r => setCustomerCounts(prev => ({ ...prev, [tier]: r.data.data?.total || 0 })))
        .catch(() => {});
    });
  }, []);

  const tierColor = (id) => id === 'overview' ? null : TIER_CFG[id]?.color;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Order performance and loyalty tier insights</p>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Sub-sidebar ── */}
        <div style={{
          width: 190,
          flexShrink: 0,
          background: 'white',
          borderRadius: 14,
          border: '1px solid #e3e8ef',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          position: 'sticky',
          top: 24,
        }}>
          {/* Sub-sidebar header */}
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f0f2f5' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Analytics</div>
          </div>

          <div style={{ padding: '8px 8px' }}>
            {/* Overview */}
            <SubNavItem
              item={NAV_ITEMS[0]}
              active={active === 'overview'}
              onClick={() => setActive('overview')}
              badge={null}
              color="#5c6ac4"
            />

            {/* Divider */}
            <div style={{ height: 1, background: '#f0f2f5', margin: '8px 8px' }} />
            <div style={{ fontSize: 9, fontWeight: 700, color: '#c4cdd8', textTransform: 'uppercase', letterSpacing: 1, padding: '4px 8px 6px' }}>By Tier</div>

            {NAV_ITEMS.slice(1).map(item => (
              <SubNavItem
                key={item.id}
                item={item}
                active={active === item.id}
                onClick={() => setActive(item.id)}
                badge={customerCounts[item.id] !== undefined ? customerCounts[item.id] : null}
                color={TIER_CFG[item.id]?.color}
              />
            ))}
          </div>

          {/* Tier total summary at bottom */}
          {Object.keys(customerCounts).length === 3 && (
            <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #f0f2f5' }}>
              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Members</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>
                {Object.values(customerCounts).reduce((a, b) => a + b, 0)}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {['silver', 'gold', 'platinum'].map(t => (
                  <div key={t} title={`${TIER_CFG[t].label}: ${customerCounts[t]}`} style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: TIER_CFG[t].color,
                    opacity: 0.7,
                    transition: 'opacity 0.15s',
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {active === 'overview' && <OverviewSection />}
          {active === 'silver'   && <TierSection tier="silver" />}
          {active === 'gold'     && <TierSection tier="gold" />}
          {active === 'platinum' && <TierSection tier="platinum" />}
        </div>
      </div>
    </div>
  );
}

function SubNavItem({ item, active, onClick, badge, color }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '9px 10px',
        background: active ? (color ? color + '12' : '#eef0fb') : hovered ? '#f8f9fb' : 'transparent',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
        marginBottom: 2,
        transition: 'background 0.12s',
        boxShadow: active ? `inset 2px 0 0 ${color || '#5c6ac4'}` : 'none',
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? (color || '#5c6ac4') : '#374151', lineHeight: 1.2 }}>{item.label}</div>
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{item.desc}</div>
      </div>
      {badge !== null && (
        <span style={{
          background: active ? (color || '#5c6ac4') : '#e5e7eb',
          color: active ? 'white' : '#6b7280',
          borderRadius: 10, padding: '1px 7px',
          fontSize: 10, fontWeight: 700, flexShrink: 0,
        }}>{badge}</span>
      )}
    </button>
  );
}
