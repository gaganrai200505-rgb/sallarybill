import { useEffect, useState } from 'react';
import api from '../api';

const C = { card: '#111827', border: '#1e2d45', accent: '#00d4ff', green: '#10b981', red: '#ef4444', yellow: '#f59e0b', text: '#e2e8f0', muted: '#64748b' };
const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const claimStatusColor = { pending: C.yellow, manager_approved: C.accent, finance_approved: C.accent, rejected: C.red, settled: C.green };

export default function AllClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);
  const { user } = { user: JSON.parse(localStorage.getItem('user') || 'null') } || {};

  useEffect(() => {
    api.get('/salary/claims/all/').then(r => setClaims(r.data)).finally(() => setLoading(false));
  }, []);

  const doAction = async (claimId, action) => {
    setActing(true);
    try {
      const { data } = await api.post(`/salary/claims/${claimId}/action/`, { action, note });
      setClaims(prev => prev.map(c => c.id === claimId ? data : c));
      setModal(null); setNote('');
    } catch (e) { alert(e.response?.data?.error || 'Action failed'); }
    finally { setActing(false); }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: C.text, margin: 0, fontWeight: 800, letterSpacing: -0.5 }}>All Reimbursement Claims</h1>
        <p style={{ color: C.muted, marginTop: 6, fontSize: 14, fontWeight: 500 }}>{claims.filter(c => c.status === 'pending').length} pending action</p>
      </div>

      {loading ? <p style={{ color: C.muted, textAlign: 'center', marginTop: 60, fontSize: 14 }}>Loading...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {claims.map(claim => {
            const sc = claimStatusColor[claim.status] || C.muted;
            return (
              <div key={claim.id} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 24px rgba(0, 212, 255, 0.2)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'; }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ color: C.text, fontWeight: 800, fontSize: 19, fontFamily: 'monospace' }}>{fmt(claim.amount)}</span>
                    <span style={{ background: `${sc}20`, color: sc, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${sc}40` }}>
                      {claim.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p style={{ color: C.muted, fontSize: 13, margin: '0 0 4px', fontWeight: 500 }}>{claim.employee_name} · {claim.bill_month}</p>
                  <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Filed: {new Date(claim.created_at).toLocaleDateString('en-IN')}</p>
                </div>

                {(claim.status === 'pending' || claim.status === 'manager_approved') && (
                  <button onClick={() => setModal(claim)} style={{
                    padding: '11px 24px', background: `${C.accent}20`, border: `1.5px solid ${C.accent}`, 
                    borderRadius: 11, color: C.accent, cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                    transition: 'all 0.3s ease',
                  }} onMouseEnter={e => { e.target.style.background = `${C.accent}40`; e.target.style.boxShadow = `0 4px 12px ${C.accent}40`; }} onMouseLeave={e => { e.target.style.background = `${C.accent}20`; e.target.style.boxShadow = 'none'; }}>
                    Take Action
                  </button>
                )}
                {claim.status === 'finance_approved' && (
                  <button onClick={() => doAction(claim.id, 'settle')} style={{
                    padding: '11px 24px', background: `${C.green}20`, border: `1.5px solid ${C.green}`,
                    borderRadius: 11, color: C.green, cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                    transition: 'all 0.3s ease',
                  }} onMouseEnter={e => { e.target.style.background = `${C.green}40`; e.target.style.boxShadow = `0 4px 12px ${C.green}40`; }} onMouseLeave={e => { e.target.style.background = `${C.green}20`; e.target.style.boxShadow = 'none'; }}>
                    Mark Settled
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)' }}>
            <h3 style={{ color: C.text, margin: '0 0 8px', fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 800 }}>Review Claim</h3>
            <p style={{ color: C.muted, fontSize: 13, margin: '0 0 24px', fontWeight: 500 }}>{modal.employee_name} · {fmt(modal.amount)}</p>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add note..."
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
