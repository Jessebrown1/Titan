import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import '../styles/admin.css';
import { AuthProvider } from '../hooks/useAuth';
import AdminLayout from './AdminLayout';
import RequireAdmin from './RequireAdmin';
import Login from './Login';
import Dashboard from './Dashboard';
import VehicleList from './VehicleList';
import VehicleEditor from './VehicleEditor';
import Enquiries from './Enquiries';
import Rentals from './Rentals';
import AppInstall from './AppInstall';
import { setupAdminApp } from '../lib/pwa';

export default function AdminRoutes() {
  useEffect(setupAdminApp, []);

  return (
    <AuthProvider>
    <Routes>
      <Route path="login" element={<Login />} />
      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="vehicles" element={<VehicleList />} />
        <Route path="vehicles/new" element={<VehicleEditor />} />
        <Route path="vehicles/:id" element={<VehicleEditor />} />
        <Route path="rentals" element={<Rentals />} />
        <Route path="app" element={<AppInstall />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
    </AuthProvider>
  );
}
