import { useEffect, useState } from 'react';
import api from '../api';

const C = { card: '#111827', border: '#1e2d45', accent: '#00d4ff', green: '#10b981', red: '#ef4444', yellow: '#f59e0b', text: '#e2e8f0', muted: '#64748b' };
const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const claimStatus = {
  pending: { color: C.yellow, label: 'Pending' },
  manager_approved: { color: C.accent, label: 'Manager Approved' },
  finance_approved: { color: C.accent, label: 'Finance Approved' },
  rejected: { color: C.red, label: 'Rejected' },
  settled: { color: C.green, label: 'Settled ✓' },
};

export default function MyClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/salary/claims/').then(r => setClaims(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: C.text, margin: 0, fontWeight: 800, letterSpacing: -0.5 }}>My Reimbursement Claims</h1>
        <p style={{ color: C.muted, marginTop: 6, fontSize: 14, fontWeight: 500 }}>Track status of your excess TDS claims</p>
      </div>

      {loading ? <p style={{ color: C.muted, textAlign: 'center', marginTop: 60, fontSize: 14 }}>Loading...</p>
        : claims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <p style={{ fontSize: 56, marginBottom: 16 }}>📋</p>
            <p style={{ color: C.muted, fontSize: 16, fontWeight: 500 }}>No claims filed yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {claims.map(claim => {
              const sm = claimStatus[claim.status] || claimStatus.pending;
              const steps = ['pending', 'manager_approved', 'finance_approved', 'settled'];
              const currentStep = steps.indexOf(claim.status);
              return (
                <div key={claim.id} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '24px', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 24px rgba(0, 212, 255, 0.2)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <span style={{ color: C.text, fontWeight: 800, fontSize: 20, fontFamily: 'monospace' }}>{fmt(claim.amount)}</span>
                        <span style={{ background: `${sm.color}20`, color: sm.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${sm.color}40` }}>{sm.label}</span>
                      </div>
                      <p style={{ color: C.muted, fontSize: 13, margin: 0, fontWeight: 500 }}>For {claim.bill_month} · Filed {new Date(claim.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <p style={{ color: C.accent, fontSize: 12, margin: 0, fontFamily: 'monospace', fontWeight: 700 }}>#{claim.id}</p>
                  </div>

                  {/* Progress */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 18 }}>
                    {['Filed', 'Manager', 'Finance', 'Settled'].map((label, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: claim.status === 'rejected' && i >= currentStep + 1 ? C.red + '30'
                              : currentStep >= i ? C.green : C.border,
                            fontSize: 12, color: currentStep >= i ? '#fff' : C.muted, margin: '0 auto', fontWeight: 800,
                            boxShadow: currentStep >= i ? `0 4px 12px ${C.green}60` : 'none', transition: 'all 0.3s ease',
                          }}>{currentStep >= i ? '✓' : i + 1}</div>
                          <p style={{ color: currentStep >= i ? C.green : C.muted, fontSize: 11, marginTop: 6, whiteSpace: 'nowrap', fontWeight: 600 }}>{label}</p>
                        </div>
                        {i < 3 && <div style={{ flex: 1, height: 2, background: currentStep > i ? C.green : C.border, margin: '0 10px', marginBottom: 20, transition: 'all 0.3s ease' }} />}
                      </div>
                    ))}
                  </div>

                  {claim.manager_note && (
                    <div style={{ background: `${C.border}20`, borderRadius: 10, padding: '12px 14px', border: `1px solid ${C.border}`, marginTop: 12 }}>
                      <p style={{ color: C.muted, fontSize: 12, margin: 0, fontStyle: 'italic', fontWeight: 500 }}>📝 Manager note: {claim.manager_note}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
