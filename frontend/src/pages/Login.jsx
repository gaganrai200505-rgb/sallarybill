import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const C = {
  bg: '#0a0f1e', card: '#111827', border: '#1e2d45',
  accent: '#00d4ff', accent2: '#7c3aed', text: '#e2e8f0', muted: '#64748b',
};

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 0%, #00d4ff0d, transparent)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 420, padding: 24, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px',
            boxShadow: `0 8px 24px rgba(0, 212, 255, 0.3)` }}>💡</div>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 800, fontFamily: "'DM Serif Display', serif", margin: 0, letterSpacing: -0.5 }}>SalaryLens</h1>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 8, fontWeight: 500 }}>Tax Validation System · Sign In</p>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
          {['username', 'password'].map(field => (
            <div key={field} style={{ marginBottom: 18 }}>
              <label style={{ color: C.muted, fontSize: 12, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>{field}</label>
              <input
                type={field === 'password' ? 'password' : 'text'}
                value={form[field]}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder={field === 'username' ? 'your_username' : '••••••••'}
                style={{
                  width: '100%', padding: '12px 14px', background: '#ffffff08',
                  border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text,
                  fontSize: 14, outline: 'none', transition: 'all 0.3s ease',
                  fontFamily: field === 'password' ? 'monospace' : 'inherit',
                }}
                onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 12px rgba(0, 212, 255, 0.2)`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          ))}

          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, background: '#ef44441a', padding: '10px 12px', borderRadius: 8, border: `1px solid #ef444440` }}>⚠ {error}</p>}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', padding: 14, background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700,
            fontSize: 15, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
            transition: 'all 0.3s ease', boxShadow: `0 4px 16px rgba(0, 212, 255, 0.3)`,
          }} onMouseEnter={e => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = `0 8px 24px rgba(0, 212, 255, 0.4)`)} onMouseLeave={e => (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = `0 4px 16px rgba(0, 212, 255, 0.3)`)}>
            {loading ? '⏳ Signing in...' : 'Sign In →'}
          </button>

          <p style={{ textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 20, fontWeight: 500 }}>
            No account? <Link to="/register" style={{ color: C.accent, textDecoration: 'none', fontWeight: 700, transition: 'all 0.3s' }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
