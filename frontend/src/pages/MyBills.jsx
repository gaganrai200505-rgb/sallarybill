import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const C = { card: '#111827', border: '#1e2d45', accent: '#00d4ff', accent2: '#7c3aed', green: '#10b981', red: '#ef4444', yellow: '#f59e0b', text: '#e2e8f0', muted: '#64748b' };
const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const statusMeta = {
  pending: { color: C.yellow, label: 'Pending' },
  under_review: { color: C.accent, label: 'Under Review' },
  approved: { color: C.green, label: 'Approved' },
  rejected: { color: C.red, label: 'Rejected' },
};
const taxMeta = {
  match: { color: C.green, icon: '✅', label: 'Accurate' },
  excess: { color: C.yellow, icon: '⚠️', label: 'Excess TDS' },
  short: { color: C.red, icon: '🚨', label: 'Short TDS' },
};

export default function MyBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/salary/bills/').then(r => setBills(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: C.text, margin: 0, fontWeight: 800, letterSpacing: -0.5 }}>My Salary Bills</h1>
          <p style={{ color: C.muted, marginTop: 6, fontSize: 14, fontWeight: 500 }}>{bills.length} total submissions</p>
        </div>
        <Link to="/upload" style={{ padding: '13px 26px', background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, borderRadius: 12, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14, transition: 'all 0.3s ease', boxShadow: `0 4px 16px rgba(0, 212, 255, 0.3)` }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0, 212, 255, 0.4)`; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 16px rgba(0, 212, 255, 0.3)`; }}>
          + Upload New
        </Link>
      </div>

      {loading ? <p style={{ color: C.muted, textAlign: 'center', marginTop: 60, fontSize: 14 }}>Loading...</p>
        : bills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <p style={{ fontSize: 56, marginBottom: 16 }}>📭</p>
            <p style={{ color: C.muted, fontSize: 16, fontWeight: 500, marginBottom: 12 }}>No bills uploaded yet</p>
            <Link to="/upload" style={{ color: C.accent, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Upload your first salary bill →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bills.map(bill => {
              const sm = statusMeta[bill.status] || statusMeta.pending;
              const tm = taxMeta[bill.tax_status];
              return (
                <div key={bill.id} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '24px', display: 'flex', alignItems: 'center', gap: 24, transition: 'all 0.3s ease', cursor: 'default', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 24px rgba(0, 212, 255, 0.2)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'; }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{bill.month} {bill.year}</span>
                      <span style={{ background: `${sm.color}20`, color: sm.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${sm.color}40` }}>{sm.label}</span>
                      {tm && <span style={{ background: `${tm.color}20`, color: tm.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${tm.color}40` }}>{tm.icon} {tm.label}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                      {[
                        ['GROSS', fmt(bill.gross_monthly)],
                        ['TDS REQUIRED', fmt(bill.monthly_tds_required)],
                        ['TDS DEDUCTED', fmt(bill.tds_deducted)],
                        ['DISCREPANCY', `${Number(bill.discrepancy || 0) >= 0 ? '+' : ''}${fmt(bill.discrepancy)}`],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <p style={{ color: C.muted, fontSize: 11, margin: '0 0 4px', fontFamily: 'monospace', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
                          <p style={{ color: C.text, fontSize: 14, margin: 0, fontFamily: 'monospace', fontWeight: 700 }}>{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {bill.tax_status === 'excess' && !bill.claim && (
                    <Link to={`/upload`} style={{ padding: '10px 18px', background: `${C.yellow}20`, border: `1.5px solid ${C.yellow}`, borderRadius: 11, color: C.yellow, textDecoration: 'none', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', transition: 'all 0.3s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${C.yellow}40`; e.currentTarget.style.boxShadow = `0 4px 12px ${C.yellow}40`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${C.yellow}20`; e.currentTarget.style.boxShadow = 'none'; }}>
                      💰 Raise Claim
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
