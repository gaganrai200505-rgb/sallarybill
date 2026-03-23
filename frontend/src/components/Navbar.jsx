import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const C = {
  bg: '#0a0f1e', border: '#1e2d45', accent: '#00d4ff',
  accent2: '#7c3aed', text: '#e2e8f0', muted: '#64748b',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Dashboard', roles: ['employee', 'manager', 'finance'] },
    { to: '/upload', label: 'Upload Bill', roles: ['employee'] },
    { to: '/my-bills', label: 'My Bills', roles: ['employee'] },
    { to: '/my-claims', label: 'My Claims', roles: ['employee'] },
    { to: '/all-bills', label: 'All Bills', roles: ['manager', 'finance'] },
    { to: '/all-claims', label: 'All Claims', roles: ['manager', 'finance'] },
  ];

  const visible = links.filter(l => l.roles.includes(user?.role));

  return (
    <nav style={{
      background: '#0a0f1eee', backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${C.border}`, padding: '0 40px',
      display: 'flex', alignItems: 'center', height: 70,
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 4px 20px rgba(0, 212, 255, 0.08)',
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, marginRight: 50 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          boxShadow: `0 4px 16px rgba(0, 212, 255, 0.3)`,
        }}>💡</div>
        <span style={{ fontWeight: 800, color: C.text, fontSize: 16, letterSpacing: -0.3 }}>SalaryLens</span>
      </Link>

      <div style={{ display: 'flex', gap: 8, flex: 1 }}>
        {visible.map(l => (
          <Link key={l.to} to={l.to} style={{
            padding: '8px 16px', borderRadius: 9, textDecoration: 'none', fontSize: 13, fontWeight: 500,
            color: location.pathname === l.to ? '#fff' : C.muted,
            background: location.pathname === l.to ? `linear-gradient(135deg, ${C.accent}dd, ${C.accent2}dd)` : 'transparent',
            transition: 'all 0.3s ease', 
            boxShadow: location.pathname === l.to ? `0 4px 12px rgba(0, 212, 255, 0.2)` : 'none',
          }}>{l.label}</Link>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right', paddingRight: 16, borderRight: `1px solid ${C.border}` }}>
          <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{user?.first_name} {user?.last_name}</div>
          <div style={{ color: C.accent, fontSize: 11, textTransform: 'capitalize', fontFamily: 'monospace', fontWeight: 600 }}>{user?.role}</div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} style={{
          background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 9,
          color: C.muted, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 500,
          transition: 'all 0.3s ease',
        }} onMouseEnter={e => { e.target.style.borderColor = C.accent; e.target.style.color = C.accent; e.target.style.boxShadow = `0 0 10px rgba(0, 212, 255, 0.2)`; }} onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.muted; e.target.style.boxShadow = 'none'; }}>Logout</button>
      </div>
    </nav>
  );
}
