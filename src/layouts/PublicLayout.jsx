import { Suspense } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DemoBanner from '../components/DemoBanner';
import { Loading } from '../components/States';
import ScrollProgress from '../components/motion/ScrollProgress';
import { useSmoothScroll } from '../hooks/useSmoothScroll';

export default function PublicLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  useSmoothScroll();
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <ScrollProgress />
      <Navbar />
      <motion.main
        id="main"
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <Suspense fallback={<div className="route-loading"><Loading /></div>}>{outlet}</Suspense>
      </motion.main>
      <DemoBanner />
      <Footer />
    </>
  );
}
