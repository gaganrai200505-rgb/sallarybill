import { useEffect, useState } from 'react';
import api from '../api';

const C = { card: '#111827', border: '#1e2d45', accent: '#00d4ff', accent2: '#7c3aed', green: '#10b981', red: '#ef4444', yellow: '#f59e0b', text: '#e2e8f0', muted: '#64748b' };
const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const statusColor = { pending: C.yellow, under_review: C.accent, approved: C.green, rejected: C.red };

export default function AllBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    api.get('/salary/bills/all/').then(r => setBills(r.data)).finally(() => setLoading(false));
  }, []);

  const doAction = async (billId, action) => {
    setActing(true);
    try {
      const { data } = await api.post(`/salary/bills/${billId}/review/`, { action, note });
      setBills(prev => prev.map(b => b.id === billId ? data : b));
      setModal(null); setNote('');
    } catch (e) { alert(e.response?.data?.error || 'Action failed'); }
    finally { setActing(false); }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: C.text, margin: 0, fontWeight: 800, letterSpacing: -0.5 }}>All Salary Bills</h1>
        <p style={{ color: C.muted, marginTop: 6, fontSize: 14, fontWeight: 500 }}>{bills.length} total records</p>
      </div>

      {loading ? <p style={{ color: C.muted, textAlign: 'center', marginTop: 60, fontSize: 14 }}>Loading...</p> : (
        <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: `${C.border}20`, borderBottom: `1.5px solid ${C.border}` }}>
                {['Employee', 'Period', 'Gross', 'TDS Due', 'TDS Actual', 'Discrepancy', 'Tax Status', 'Bill Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '16px 18px', textAlign: 'left', color: C.muted, fontSize: 11, fontFamily: 'monospace', letterSpacing: 0.8, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bills.map((b, i) => {
                const disc = Number(b.discrepancy || 0);
                const taxColors = { match: C.green, excess: C.yellow, short: C.red };
                return (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${C.border}20`, transition: 'all 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = `${C.border}10`}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 18px', color: C.text, fontSize: 13, fontWeight: 500 }}>{b.employee_name}</td>
                    <td style={{ padding: '16px 18px', color: C.muted, fontSize: 13 }}>{b.month} {b.year}</td>
                    <td style={{ padding: '16px 18px', color: C.text, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>{fmt(b.gross_monthly)}</td>
                    <td style={{ padding: '16px 18px', color: C.accent, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>{fmt(b.monthly_tds_required)}</td>
                    <td style={{ padding: '16px 18px', color: C.text, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>{fmt(b.tds_deducted)}</td>
                    <td style={{ padding: '16px 18px', color: taxColors[b.tax_status] || C.muted, fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>
                      {disc >= 0 ? '+' : ''}{fmt(disc)}
                    </td>
                    <td style={{ padding: '16px 18px' }}>
                      {b.tax_status && <span style={{ background: `${taxColors[b.tax_status]}20`, color: taxColors[b.tax_status], padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${taxColors[b.tax_status]}40` }}>
                        {b.tax_status.toUpperCase()}
                      </span>}
                    </td>
                    <td style={{ padding: '16px 18px' }}>
                      <span style={{ background: `${statusColor[b.status] || C.muted}20`, color: statusColor[b.status] || C.muted, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${(statusColor[b.status] || C.muted)}40` }}>
                        {b.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px 18px' }}>
                      {b.status === 'pending' && (
                        <button onClick={() => setModal(b)} style={{ padding: '7px 16px', background: `${C.accent}20`, border: `1.5px solid ${C.accent}`, borderRadius: 9, color: C.accent, cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.3s ease' }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${C.accent}40`; e.currentTarget.style.boxShadow = `0 4px 12px ${C.accent}40`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = `${C.accent}20`; e.currentTarget.style.boxShadow = 'none'; }}>
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)' }}>
            <h3 style={{ color: C.text, margin: '0 0 8px', fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 800 }}>Review Bill</h3>
            <p style={{ color: C.muted, fontSize: 13, margin: '0 0 24px', fontWeight: 500 }}>{modal.employee_name} · {modal.month} {modal.year}</p>
            <div style={{ background: `${C.border}20`, borderRadius: 12, padding: '16px 18px', marginBottom: 20, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: C.muted, fontSize: 13, fontWeight: 600 }}>Gross Monthly</span>
                <span style={{ color: C.text, fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>{fmt(modal.gross_monthly)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: C.muted, fontSize: 13, fontWeight: 600 }}>TDS Required</span>
                <span style={{ color: C.accent, fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>{fmt(modal.monthly_tds_required)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                <span style={{ color: C.muted, fontSize: 13, fontWeight: 600 }}>Tax Status</span>
                <span style={{ color: { match: C.green, excess: C.yellow, short: C.red }[modal.tax_status], fontSize: 13, fontWeight: 800 }}>
                  {modal.tax_status?.toUpperCase()}
                </span>
              </div>
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add review note (optional)..."
              style={{ width: '100%', padding: '12px 14px', background: '#ffffff08', border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 90, marginBottom: 20, transition: 'all 0.3s ease', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 12px rgba(0, 212, 255, 0.2)`; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 13, background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 11, color: C.muted, cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s ease' }}
                onMouseEnter={e => { e.target.style.borderColor = C.accent; e.target.style.color = C.accent; }}
                onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.muted; }}>Cancel</button>
              <button onClick={() => doAction(modal.id, 'reject')} disabled={acting} style={{ flex: 1, padding: 13, background: `${C.red}20`, border: `1.5px solid ${C.red}`, borderRadius: 11, color: C.red, cursor: 'pointer', fontWeight: 700, transition: 'all 0.3s ease', opacity: acting ? 0.7 : 1 }}
                onMouseEnter={e => !acting && (e.target.style.background = `${C.red}40`, e.target.style.boxShadow = `0 4px 12px ${C.red}40`)}
                onMouseLeave={e => (e.target.style.background = `${C.red}20`, e.target.style.boxShadow = 'none')}>Reject</button>
              <button onClick={() => doAction(modal.id, 'approve')} disabled={acting} style={{ flex: 1, padding: 13, background: `${C.green}20`, border: `1.5px solid ${C.green}`, borderRadius: 11, color: C.green, cursor: 'pointer', fontWeight: 700, transition: 'all 0.3s ease', opacity: acting ? 0.7 : 1 }}
                onMouseEnter={e => !acting && (e.target.style.background = `${C.green}40`, e.target.style.boxShadow = `0 4px 12px ${C.green}40`)}
                onMouseLeave={e => (e.target.style.background = `${C.green}20`, e.target.style.boxShadow = 'none')}>Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
