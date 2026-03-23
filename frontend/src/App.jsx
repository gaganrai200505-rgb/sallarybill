import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadBill from './pages/UploadBill';
import MyBills from './pages/MyBills';
import MyClaims from './pages/MyClaims';
import AllBills from './pages/AllBills';
import AllClaims from './pages/AllClaims';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 70% 40% at 50% -5%, #00d4ff0a, transparent), radial-gradient(ellipse 40% 30% at 90% 90%, #7c3aed08, transparent)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        {children}
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/upload" element={<PrivateRoute roles={['employee']}><Layout><UploadBill /></Layout></PrivateRoute>} />
      <Route path="/my-bills" element={<PrivateRoute roles={['employee']}><Layout><MyBills /></Layout></PrivateRoute>} />
      <Route path="/my-claims" element={<PrivateRoute roles={['employee']}><Layout><MyClaims /></Layout></PrivateRoute>} />
      <Route path="/all-bills" element={<PrivateRoute roles={['manager', 'finance']}><Layout><AllBills /></Layout></PrivateRoute>} />
      <Route path="/all-claims" element={<PrivateRoute roles={['manager', 'finance']}><Layout><AllClaims /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
