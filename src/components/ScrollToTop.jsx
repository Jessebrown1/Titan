import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getLenis } from '../hooks/useSmoothScroll';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        requestAnimationFrame(() => {
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(el, { offset: -80 });
          else el.scrollIntoView({ behavior: 'smooth' });
        });
        return;
      }
    }
    getLenis()?.scrollTo(0, { immediate: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}
