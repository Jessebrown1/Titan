import { useEffect } from 'react';
import Lenis from 'lenis';
import { prefersReducedMotion } from '../lib/motion';

// Inertia-based smooth scrolling for the public site (skipped for reduced motion).
let lenis = null;
export const getLenis = () => lenis;

export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: { offset: -80 } });
    let frame;
    const raf = (time) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenis = null;
    };
  }, []);
}

// Pause page scrolling (menus, lightboxes) — works with or without Lenis.
export function lockScroll(locked) {
  document.body.style.overflow = locked ? 'hidden' : '';
  if (lenis) (locked ? lenis.stop() : lenis.start());
}
