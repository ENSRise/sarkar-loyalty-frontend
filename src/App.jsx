import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './components/AuthLayout';

import Login          from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Register       from './pages/Register.jsx';
import Dashboard      from './pages/Dashboard.jsx';
import Transactions   from './pages/Transactions.jsx';
import Analytics      from './pages/Analytics.jsx';
import Customers      from './pages/Customers.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';
import TierSettings   from './pages/TierSettings.jsx';
import RoleManagement from './pages/RoleManagement.jsx';
import JoinLoyalty    from './pages/JoinLoyalty.jsx';
import ScanScanner    from './pages/ScanScanner.jsx';
import ReferralPage   from './pages/ReferralPage.jsx';
import ReferralJoin   from './pages/ReferralJoin.jsx';
import ReferralStats      from './pages/ReferralStats.jsx';
import GeneralSettings    from './pages/GeneralSettings.jsx';
import AmountSettlement     from './pages/AmountSettlement.jsx';
import InterestedCustomers  from './pages/InterestedCustomers.jsx';
import CustomerBonus        from './pages/CustomerBonus.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public — no auth, no sidebar */}
          <Route path="/register"        element={<Register />} />
          <Route path="/referral-join"   element={<ReferralJoin />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin panel — AuthLayout handles auth check + sidebar + Outlet */}
          <Route element={<AuthLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard"    element={<ProtectedRoute permission="dashboard">   <Dashboard />    </ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute permission="transactions"><Transactions /></ProtectedRoute>} />
            <Route path="/analytics"    element={<ProtectedRoute permission="analytics">  <Analytics />    </ProtectedRoute>} />
            <Route path="/customers"    element={<ProtectedRoute permission="customers">   <Customers />    </ProtectedRoute>} />
            <Route path="/customers/:shopifyCustomerId" element={<ProtectedRoute permission="customers"><CustomerDetail /></ProtectedRoute>} />
            <Route path="/tier-settings"   element={<ProtectedRoute permission="tier_settings"> <TierSettings />   </ProtectedRoute>} />
            <Route path="/role-management" element={<ProtectedRoute permission="role_management"><RoleManagement /></ProtectedRoute>} />

            {/* Super admin exclusive */}
            <Route path="/join-loyalty" element={<ProtectedRoute permission="join_loyalty"><JoinLoyalty /></ProtectedRoute>} />
            <Route path="/scan-scanner" element={<ProtectedRoute permission="scan_loyalty"><ScanScanner /></ProtectedRoute>} />
            <Route path="/referral"       element={<ProtectedRoute permission="referral"><ReferralPage /></ProtectedRoute>} />
            <Route path="/referral-stats"         element={<ReferralStats />} />
            <Route path="/interested-customers"  element={<ProtectedRoute permission="interested_customers"><InterestedCustomers /></ProtectedRoute>} />
            <Route path="/amount-settlement"  element={<AmountSettlement />} />
            <Route path="/customer-bonus"      element={<ProtectedRoute permission="customer_bonus"><CustomerBonus /></ProtectedRoute>} />
            <Route path="/general-settings"   element={<ProtectedRoute permission="general_settings"><GeneralSettings /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
