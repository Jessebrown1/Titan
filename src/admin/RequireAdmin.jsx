import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabase';
import SetupNotice from './SetupNotice';
import { Loading } from '../components/States';

export default function RequireAdmin({ children }) {
  const { session, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (!isSupabaseConfigured) return <SetupNotice />;
  if (loading) return <div className="login login--loading"><Loading /></div>;
  if (!session || !isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}
