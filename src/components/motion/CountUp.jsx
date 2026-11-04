import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';
import { EASE, prefersReducedMotion } from '../../lib/motion';

// Counts up to a number once visible; non-numeric values render as-is.
export default function CountUp({ value, duration = 0.9, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const numeric = typeof value === 'number' && Number.isFinite(value);
  const [display, setDisplay] = useState(numeric ? 0 : value);

  useEffect(() => {
    if (!numeric) {
      setDisplay(value);
      return undefined;
    }
    if (!inView) return undefined;
    if (prefersReducedMotion()) {
      setDisplay(value);
      return undefined;
    }
    // Years count from a nearby start so they don't spin through centuries.
    const from = value > 1900 ? value - 12 : 0;
    const controls = animate(from, value, {
      duration,
      delay,
      ease: EASE,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, numeric, duration, delay]);

  return <span ref={ref} className="countup">{display}</span>;
}
