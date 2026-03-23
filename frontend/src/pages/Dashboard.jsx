import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const C = { bg: '#0a0f1e', card: '#111827', border: '#1e2d45', accent: '#00d4ff', accent2: '#7c3aed', green: '#10b981', red: '#ef4444', yellow: '#f59e0b', text: '#e2e8f0', muted: '#64748b' };

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function StatCard({ label, value, color, icon, sub }) {
  return (
    <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '24px', 
      transition: 'all 0.3s ease', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color || C.accent; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 24px ${(color || C.accent)}40`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: C.muted, fontSize: 11, letterSpacing: 1, margin: '0 0 10px', fontFamily: 'monospace', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
          <p style={{ color: color || C.text, fontSize: 28, fontWeight: 800, margin: 0, fontFamily: 'monospace' }}>{value}</p>
          {sub && <p style={{ color: C.muted, fontSize: 12, marginTop: 6, fontWeight: 500 }}>{sub}</p>}
        </div>
        <span style={{ fontSize: 32 }}>{icon}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBills, setRecentBills] = useState([]);

  useEffect(() => {
    api.get('/salary/dashboard/').then(r => setStats(r.data));
    const endpoint = user?.role === 'employee' ? '/salary/bills/' : '/salary/bills/all/';
    api.get(endpoint).then(r => setRecentBills(r.data.slice(0, 5)));
  }, [user]);

  const pieData = stats ? [
    { name: 'Approved', value: stats.approved_bills, color: C.green },
    { name: 'Pending', value: stats.pending_bills, color: C.yellow },
    { name: 'Other', value: Math.max(0, stats.total_bills - stats.approved_bills - stats.pending_bills), color: C.border },
  ] : [];

  const statusColor = s => ({ approved: C.green, pending: C.yellow, under_review: C.accent, rejected: C.red }[s] || C.muted);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: C.text, margin: 0, fontWeight: 800, letterSpacing: -0.5 }}>
          Good day, {user?.first_name} 👋
        </h1>
        <p style={{ color: C.muted, marginTop: 8, fontSize: 14, fontWeight: 500 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          &nbsp;·&nbsp;<span style={{ color: C.accent, textTransform: 'capitalize', fontWeight: 600 }}>{user?.role}</span>
        </p>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 36 }}>
          <StatCard label="TOTAL BILLS" value={stats.total_bills} icon="📄" sub="Uploaded salary slips" />
          <StatCard label="PENDING REVIEW" value={stats.pending_bills} color={C.yellow} icon="⏳" />
          <StatCard label="APPROVED" value={stats.approved_bills} color={C.green} icon="✅" />
          <StatCard label="CLAIMS FILED" value={stats.total_claims} color={C.accent} icon="📋" />
          <StatCard label="CLAIMS SETTLED" value={stats.settled_claims} color={C.green} icon="💰" />
          {user?.role !== 'employee' && (
            <StatCard label="TOTAL DISCREPANCY" value={fmt(stats.total_discrepancy)} color={C.red} icon="⚠️" sub="Excess TDS in system" />
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 32 }}>
        <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 28, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}>
          <p style={{ color: C.muted, fontSize: 12, fontFamily: 'monospace', letterSpacing: 1, margin: '0 0 20px', fontWeight: 600, textTransform: 'uppercase' }}>RECENT SALARY BILLS</p>
          {recentBills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ color: C.muted, fontSize: 32, marginBottom: 12 }}>📭</p>
              <p style={{ color: C.muted, fontWeight: 500, marginBottom: 12 }}>No bills yet</p>
              {user?.role === 'employee' && (
                <Link to="/upload" style={{ color: C.accent, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Upload your first bill →</Link>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
                  {['Employee', 'Month/Year', 'Gross', 'TDS Due', 'Status'].map(h => (
                    <th key={h} style={{ color: C.muted, fontSize: 11, textAlign: 'left', padding: '0 12px 14px 0', fontFamily: 'monospace', letterSpacing: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBills.map((b, i) => (
                  <tr key={b.id} style={{ borderTop: `1px solid ${C.border}20`, transition: 'all 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = `${C.border}10`}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 12px 14px 0', color: C.text, fontSize: 13, fontWeight: 500 }}>{b.employee_name}</td>
                    <td style={{ padding: '14px 12px 14px 0', color: C.muted, fontSize: 13 }}>{b.month} {b.year}</td>
                    <td style={{ padding: '14px 12px 14px 0', color: C.text, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>{fmt(b.gross_monthly)}</td>
                    <td style={{ padding: '14px 12px 14px 0', color: C.accent, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>{fmt(b.monthly_tds_required)}</td>
                    <td style={{ padding: '14px 0' }}>
                      <span style={{ background: `${statusColor(b.status)}20`, color: statusColor(b.status), padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${statusColor(b.status)}40` }}>
                        {b.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 28, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}>
          <p style={{ color: C.muted, fontSize: 12, fontFamily: 'monospace', letterSpacing: 1, margin: '0 0 18px', fontWeight: 600, textTransform: 'uppercase' }}>BILL STATUS OVERVIEW</p>
          {stats && (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={v => [v, 'Bills']} contentStyle={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}20` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, boxShadow: `0 0 8px ${d.color}80` }} />
                  <span style={{ color: C.muted, fontSize: 13, fontWeight: 500 }}>{d.name}</span>
                </div>
                <span style={{ color: C.text, fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {user?.role === 'employee' && (
        <div style={{ display: 'flex', gap: 14 }}>
          <Link to="/upload" style={{
            padding: '14px 28px', background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            borderRadius: 12, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14,
            transition: 'all 0.3s ease', boxShadow: `0 4px 16px rgba(0, 212, 255, 0.3)`,
          }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0, 212, 255, 0.4)`; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 16px rgba(0, 212, 255, 0.3)`; }}>+ Upload Salary Bill</Link>
          <Link to="/my-claims" style={{
            padding: '14px 28px', background: C.card, border: `1.5px solid ${C.border}`,
            borderRadius: 12, color: C.text, textDecoration: 'none', fontSize: 14, fontWeight: 600,
            transition: 'all 0.3s ease',
          }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 4px 12px rgba(0, 212, 255, 0.2)`; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}>View My Claims</Link>
        </div>
      )}
    </div>
  );
}
