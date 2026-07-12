import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentDashboard from './pages/ResidentDashboard';
import ComplaintDetail from './pages/ComplaintDetail';
import RaiseComplaint from './pages/RaiseComplaint';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import AdminResidents from './pages/AdminResidents';
import AdminResidentProfile from './pages/AdminResidentProfile';
import AdminStaff from './pages/AdminStaff';
import AdminStaffProfile from './pages/AdminStaffProfile';
import AdminBilling from './pages/AdminBilling';
import ResidentBills from './pages/ResidentBills';
import Receipt from './pages/Receipt';
import AdminVisitors from './pages/AdminVisitors';
import ResidentVisitors from './pages/ResidentVisitors';
import SecurityVisitors from './pages/SecurityVisitors';
import DocumentCenter from './pages/DocumentCenter';
import NoticeBoard from './pages/NoticeBoard';
import NotFound from './pages/NotFound';
import { AuthContext } from './context/AuthContext';

const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));

axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

function App() {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(res => {
          setAuth({ token, user: res.data });
        })
        .catch(() => {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setAuth(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setAuth({ token, user });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setAuth(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-surface-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-surface-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ auth, handleLogin, handleLogout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={auth ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={auth ? <Navigate to="/" /> : <Register />} />

          {auth ? (
            <>
              {auth.user.role === 'resident' ? (
                <>
                  <Route path="/" element={<ResidentDashboard />} />
                  <Route path="/complaint/:id" element={<ComplaintDetail />} />
                  <Route path="/raise-complaint" element={<RaiseComplaint />} />
                  <Route path="/bills" element={<ResidentBills />} />
                  <Route path="/receipt/:id" element={<Receipt />} />
                  <Route path="/my-visitors" element={<ResidentVisitors />} />
                  <Route path="/notices" element={<NoticeBoard />} />
                </>
              ) : auth.user.role === 'security' ? (
                <>
                  <Route path="/" element={<SecurityVisitors />} />
                  <Route path="/notices" element={<NoticeBoard />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/complaints" element={<AdminComplaints />} />
                  <Route path="/complaint/:id" element={<ComplaintDetail />} />
                  <Route path="/residents" element={<AdminResidents />} />
                  <Route path="/residents/:id" element={<AdminResidentProfile />} />
                  <Route path="/staff" element={<AdminStaff />} />
                  <Route path="/staff/:id" element={<AdminStaffProfile />} />
                  <Route path="/billing" element={<AdminBilling />} />
                  <Route path="/visitors" element={<AdminVisitors />} />
                  <Route path="/documents" element={<DocumentCenter />} />
                  <Route path="/analytics" element={<Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-surface-200 border-t-brand-600 rounded-full animate-spin" /></div>}><AdminAnalytics /></Suspense>} />
                  <Route path="/notices" element={<NoticeBoard />} />
                </>
              )}
            </>
          ) : (
            <Route path="/" element={<Navigate to="/login" />} />
          )}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
