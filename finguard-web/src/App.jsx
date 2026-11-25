import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import BorrowerDashboard from './pages/BorrowerDashboard';
import BorrowerLoanApply from './pages/BorrowerLoanApply';
import BorrowerLoanDetail from './pages/BorrowerLoanDetail';
import BorrowerRepayments from './pages/BorrowerRepayments';

function StaffRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (user.role === 'BORROWER' || user.role === 'USER') {
    return <Navigate to="/portal" replace />;
  }
  return children;
}

function BorrowerRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (user.role !== 'BORROWER' && user.role !== 'USER') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/change-password" element={<ChangePassword />} />

            {/* Staff Console */}
            <Route
              path="/dashboard"
              element={
                <StaffRoute>
                  <Dashboard />
                </StaffRoute>
              }
            />

            {/* Borrower Portal */}
            <Route
              path="/portal"
              element={
                <BorrowerRoute>
                  <BorrowerDashboard />
                </BorrowerRoute>
              }
            />
            <Route
              path="/portal/apply"
              element={
                <BorrowerRoute>
                  <BorrowerLoanApply />
                </BorrowerRoute>
              }
            />
            <Route
              path="/portal/loans/:id"
              element={
                <BorrowerRoute>
                  <BorrowerLoanDetail />
                </BorrowerRoute>
              }
            />
            <Route
              path="/portal/repayments"
              element={
                <BorrowerRoute>
                  <BorrowerRepayments />
                </BorrowerRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
