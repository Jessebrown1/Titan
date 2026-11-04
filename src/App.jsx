import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import ScrollToTop from './components/ScrollToTop';
import { Loading } from './components/States';
import Home from './pages/Home';

const loadVehicles = () => import('./pages/Vehicles');
const loadVehicleDetail = () => import('./pages/VehicleDetail');
const loadAbout = () => import('./pages/About');
const loadContact = () => import('./pages/Contact');

const Vehicles = lazy(loadVehicles);
const VehicleDetail = lazy(loadVehicleDetail);
const About = lazy(loadAbout);
const Contact = lazy(loadContact);
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin is split into its own chunk so public visitors never download it.
const AdminRoutes = lazy(() => import('./admin/AdminRoutes'));

export default function App() {
  // Fetch the other public pages while idle so navigating to them is instant.
  useEffect(() => {
    const warm = () => [loadVehicles, loadVehicleDetail, loadAbout, loadContact].forEach((load) => load());
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(warm, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(warm, 1500);
    return () => clearTimeout(id);
  }, []);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><Loading /></div>}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="rent" element={<Vehicles rentOnly />} />
            <Route path="vehicles/:id" element={<VehicleDetail />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="admin/*" element={<AdminRoutes />} />
        </Routes>
      </Suspense>
    </>
  );
}
