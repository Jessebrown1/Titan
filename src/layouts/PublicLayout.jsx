import { Suspense } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          id="main"
          key={location.pathname}
          initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
          exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Suspense fallback={<div className="route-loading"><Loading /></div>}>{outlet}</Suspense>
        </motion.main>
      </AnimatePresence>
      <DemoBanner />
      <Footer />
    </>
  );
}
