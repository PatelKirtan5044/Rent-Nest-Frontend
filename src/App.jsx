import { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PropertyListings from './pages/PropertyListings';
import PropertyDetails from './pages/PropertyDetails';
import PublicPropertyDetails from './pages/PublicPropertyDetails';
import AgreementManagement from './pages/AgreementManagement';
import RentPayments from './pages/RentPayments';
import MaintenanceRequests from './pages/MaintenanceRequests';
import Applications from './pages/Applications';
import PublicHome from './pages/PublicHome';

// Protected Route Guard
const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0b10', color: '#fff' }}>
        Loading Secure Rental Portal...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div className="main-content">
        <Navbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Outlet />
      </div>
      <Toast />
    </div>
  );
};

const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Authentication routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" replace />} />

      {/* Public Home Page & Details before Login */}
      {!user && <Route path="/" element={<PublicHome />} />}
      {!user && <Route path="/properties/:id" element={<PublicPropertyDetails />} />}

      {/* Protected routes */}
      <Route element={<ProtectedLayout />}>
        {user && <Route path="/" element={<Dashboard />} />}
        <Route path="/properties" element={<PropertyListings />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/agreements" element={<AgreementManagement />} />
        <Route path="/payments" element={<RentPayments />} />
        <Route path="/maintenance" element={<MaintenanceRequests />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
