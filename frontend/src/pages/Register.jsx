import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const C = { bg: '#0a0f1e', card: '#111827', border: '#1e2d45', accent: '#00d4ff', accent2: '#7c3aed', text: '#e2e8f0', muted: '#64748b' };

const Field = ({ label, field, type = 'text', placeholder, value, onChange }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ color: C.muted, fontSize: 12, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>{label}</label>
    <input type={type} value={value} placeholder={placeholder}
      onChange={onChange}
      style={{ width: '100%', padding: '12px 14px', background: '#ffffff08', border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: 'none', transition: 'all 0.3s ease' }}
      onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 12px rgba(0, 212, 255, 0.2)`; }}
      onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
    />
  </div>
);

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', first_name: '', last_name: '', password: '', role: 'employee', department: '', employee_id: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try { await register(form); navigate('/'); }
    catch (e) { setError(Object.values(e.response?.data || {}).flat()[0] || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 0%, #00d4ff0d, transparent)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 500, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px',
            boxShadow: `0 8px 24px rgba(0, 212, 255, 0.3)` }}>💡</div>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 800, fontFamily: "'DM Serif Display', serif", margin: 0, letterSpacing: -0.5 }}>Create Account</h1>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 8, fontWeight: 500 }}>Join SalaryLens Today</p>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="FIRST NAME" field="first_name" placeholder="Rajesh" value={form.first_name} onChange={e => handleChange('first_name', e.target.value)} />
            <Field label="LAST NAME" field="last_name" placeholder="Kumar" value={form.last_name} onChange={e => handleChange('last_name', e.target.value)} />
          </div>
          <Field label="USERNAME" field="username" placeholder="rajesh.kumar" value={form.username} onChange={e => handleChange('username', e.target.value)} />
          <Field label="EMAIL" field="email" type="email" placeholder="rajesh@company.com" value={form.email} onChange={e => handleChange('email', e.target.value)} />
          <Field label="EMPLOYEE ID" field="employee_id" placeholder="EMP-2041" value={form.employee_id} onChange={e => handleChange('employee_id', e.target.value)} />
          <Field label="DEPARTMENT" field="department" placeholder="Engineering" value={form.department} onChange={e => handleChange('department', e.target.value)} />

          <div style={{ marginBottom: 16 }}>
            <label style={{ color: C.muted, fontSize: 12, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>ROLE</label>
            <select value={form.role} onChange={e => handleChange('role', e.target.value)}
              style={{ width: '100%', padding: '12px 14px', background: '#ffffff08', border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: 'none', transition: 'all 0.3s ease', cursor: 'pointer' }}
              onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 12px rgba(0, 212, 255, 0.2)`; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="finance">Finance Admin</option>
            </select>
          </div>

          <Field label="PASSWORD" field="password" type="password" placeholder="••••••••" value={form.password} onChange={e => handleChange('password', e.target.value)} />
          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, background: '#ef44441a', padding: '10px 12px', borderRadius: 8, border: `1px solid #ef444440` }}>⚠ {error}</p>}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', padding: 14, background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'wait' : 'pointer',
            transition: 'all 0.3s ease', boxShadow: `0 4px 16px rgba(0, 212, 255, 0.3)`, opacity: loading ? 0.7 : 1,
          }} onMouseEnter={e => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = `0 8px 24px rgba(0, 212, 255, 0.4)`)} onMouseLeave={e => (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = `0 4px 16px rgba(0, 212, 255, 0.3)`)}>
            {loading ? '⏳ Creating...' : 'Create Account →'}
          </button>

          <p style={{ textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 20, fontWeight: 500 }}>
            Already have an account? <Link to="/login" style={{ color: C.accent, textDecoration: 'none', fontWeight: 700 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
