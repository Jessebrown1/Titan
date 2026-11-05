import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { animate, motion } from 'framer-motion';
import { prefersReducedMotion } from '../../lib/motion';

const SEEN_KEY = 'titan-gauge';
const C = 150; // gauge centre
const R = 128; // dial radius
const START = -130; // needle angle at 0
const SWEEP = 260; // full dial, in degrees
const TOP_SPEED = 240;
const TICKS = 48;

const point = (deg, r) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

function firstChangeThisVisit() {
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return false;
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch { /* storage blocked: treat every change as a quiet one */ return false; }
  return true;
}

// Plays once per visit, like the start-up sweep of a luxury car's instrument cluster:
// the needle rises to the top of the dial, falls back to rest, and the page appears.
function IgnitionSweep({ onDone }) {
  const needle = useRef(null);
  const arc = useRef(null);
  const speed = useRef(null);
  const [leaving, setLeaving] = useState(false);

  const dial = useMemo(() => {
    const [x1, y1] = point(START, R);
    const [x2, y2] = point(START + SWEEP, R);
    return `M${x1} ${y1}A${R} ${R} 0 1 1 ${x2} ${y2}`;
  }, []);

  useEffect(() => {
    const controls = animate(0, 1, {
      duration: 1.25,
      delay: 0.1,
      ease: 'linear',
      onUpdate: (t) => {
        const p = Math.sin(Math.PI * t) ** 1.4; // up and back down, easing at both ends
        needle.current?.setAttribute('transform', `rotate(${START + p * SWEEP} ${C} ${C})`);
        arc.current?.setAttribute('stroke-dashoffset', String(1 - p));
        if (speed.current) speed.current.textContent = Math.round(p * TOP_SPEED);
      },
      onComplete: () => setLeaving(true),
    });
    // Safety net: never leave the overlay up if the browser pauses the animation.
    const failsafe = setTimeout(onDone, 3000);
    return () => {
      controls.stop();
      clearTimeout(failsafe);
    };
  }, [onDone]);

  return (
    <motion.div
      className="ignition"
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      onAnimationComplete={() => leaving && onDone()}
    >
      <motion.svg
        className="gauge"
        viewBox="0 0 300 300"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: leaving ? 1.03 : 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <path className="gauge__track" d={dial} pathLength="1" />
        <path ref={arc} className="gauge__fill" d={dial} pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
        {Array.from({ length: TICKS + 1 }, (_, i) => {
          const deg = START + (SWEEP / TICKS) * i;
          const major = i % 12 === 0;
          const [x1, y1] = point(deg, 118);
          const [x2, y2] = point(deg, major ? 106 : 113);
          return <line key={i} className={major ? 'gauge__tick gauge__tick--major' : 'gauge__tick'} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        {[0, 12, 24, 36, 48].map((i) => {
          const [x, y] = point(START + (SWEEP / TICKS) * i, 92);
          return <text key={i} className="gauge__mark" x={x} y={y + 3.5}>{(TOP_SPEED / TICKS) * i}</text>;
        })}
        <g ref={needle} className="gauge__needle" transform={`rotate(${START} ${C} ${C})`}>
          <path d="M148.9 150L149.7 34h.6l.8 116Z" />
        </g>
        <circle className="gauge__hub" cx={C} cy={C} r="4.5" />
        <text ref={speed} className="gauge__speed" x={C} y="214">0</text>
        <text className="gauge__unit" x={C} y="232">KM/H</text>
      </motion.svg>
    </motion.div>
  );
}

// Every other page change: a brief fade with a fine line drawn across the top.
function QuietFade({ onDone }) {
  useEffect(() => {
    const failsafe = setTimeout(onDone, 700);
    return () => clearTimeout(failsafe);
  }, [onDone]);

  return (
    <motion.div
      className="quiet"
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      <motion.span className="quiet__line" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
    </motion.div>
  );
}

// Neither adds waiting: the new page is already rendered underneath.
export default function RouteCurtain() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  const [run, setRun] = useState(null);
  const finish = useRef(() => setRun(null)).current;

  useLayoutEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    if (prefersReducedMotion()) return;
    setRun({ id: pathname, full: firstChangeThisVisit() });
  }, [pathname]);

  if (!run) return null;
  return run.full ? <IgnitionSweep key={run.id} onDone={finish} /> : <QuietFade key={run.id} onDone={finish} />;
}
