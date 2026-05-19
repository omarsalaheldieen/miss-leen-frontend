import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';

import DashboardLayout  from './components/layout/DashboardLayout';
import LoginPage        from './pages/LoginPage';
import EmployeesPage    from './pages/employees/EmployeesPage';
import UsersPage        from './pages/users/UsersPage';
import SalaryPage       from './pages/SalaryPage';
import AttendancePage   from './pages/AttendancePage';
import CashAdvancesPage from './pages/cashAdvances/CashAdvancesPage';
import LedgerPage       from './pages/LedgerPage';

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#fff' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'4px solid #E0E0E0', borderTopColor:'#CC1010', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
        <p style={{ color:'#767676', fontFamily:'Cairo, sans-serif', fontSize:14 }}>جارٍ التحميل...</p>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { getHomePage } = useAuth();
  return <Navigate to={getHomePage()} replace />;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <HomeRedirect /> : children;
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <Spinner />;
  return isAdmin ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { fontFamily:'Cairo, sans-serif', direction:'rtl', fontSize:14, borderRadius:10, background:'#1A1A1A', color:'#fff' },
            success: { iconTheme: { primary:'#CC1010', secondary:'#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<HomeRedirect />} />
            <Route path="employees"     element={<EmployeesPage />} />
            <Route path="attendance"    element={<AttendancePage />} />
            <Route path="salary"        element={<SalaryPage />} />
            <Route path="cash-advances" element={<CashAdvancesPage />} />
            <Route path="ledger"        element={<LedgerPage />} />
            <Route path="users"         element={<AdminRoute><UsersPage /></AdminRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
