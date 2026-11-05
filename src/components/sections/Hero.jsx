import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { CircleCheck, Pause, Play } from 'lucide-react';
import SplitText from '../motion/SplitText';
import Magnetic from '../motion/Magnetic';
import CountUp from '../motion/CountUp';
import TrustBadge from '../TrustBadge';
import { EASE, finePointer, prefersReducedMotion } from '../../lib/motion';
import { isSplashDone, onSplashDone } from '../../lib/splash';

const CARS = [
  { key: 'suv', file: 'hero-car', label: 'SUV', alt: 'Black Lexus RX SUV' },
  { key: 'sports', file: 'hero-sports', label: 'Sports', alt: 'Silver Porsche 911 GT3 RS sports car' },
  { key: 'truck', file: 'hero-truck', label: 'Truck', alt: 'Blue Ford F-150 pickup truck' },
  { key: 'sedan', file: 'hero-sedan', label: 'Sedan', alt: 'Grey Toyota Camry sedan' },
];
const srcOf = (car) => `/images/${car.file}.webp`;
const srcSetOf = (car) => `/images/${car.file}-860.webp 860w, ${srcOf(car)} 1500w`;

// Drive in, park, then accelerate off to the left before the next car arrives.
const ARRIVE_S = 3.2;
const PARKED_MS = 4800;
const driving = {
  enter: { opacity: 0, x: '46%' },
  parked: {
    opacity: 1,
    x: '0%',
    transition: {
      x: { duration: ARRIVE_S, delay: 0.15, ease: [0.2, 0.7, 0.2, 1] },
      opacity: { duration: 1.2, delay: 0.15, ease: 'easeOut' },
    },
  },
  leave: { x: '-185%', opacity: 1, transition: { duration: 1.5, ease: [0.6, 0, 0.9, 0.4] } },
};

export default function Hero({ vehicles }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(isSplashDone);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(prefersReducedMotion);
  const car = CARS[index];

  useEffect(() => onSplashDone(() => setReady(true)), []);

  // Move on to the next car, and fetch its image ahead of time.
  useEffect(() => {
    if (!ready) return undefined;
    const next = CARS[(index + 1) % CARS.length];
    const preload = new Image();
    preload.srcset = srcSetOf(next);
    preload.sizes = '(max-width: 900px) 100vw, 62vw';
    preload.src = srcOf(next);
    preload.decode?.().catch(() => {});
    if (paused) return undefined;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % CARS.length), ARRIVE_S * 1000 + PARKED_MS);
    return () => clearTimeout(timer);
  }, [index, paused, ready]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const carY = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);
  const typeY = useTransform(scrollYProgress, [0, 1], ['0%', '-12%']);
  const typeOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);

  // Cursor parallax: the car and the type drift in opposite directions for depth.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 60, damping: 18, mass: 0.8 };
  const carX = useSpring(useTransform(mx, [-1, 1], [18, -18]), spring);
  const carTilt = useSpring(useTransform(my, [-1, 1], [-8, 8]), spring);
  const wordX = useSpring(useTransform(mx, [-1, 1], [-10, 10]), spring);

  const onPointerMove = (e) => {
    if (!finePointer() || prefersReducedMotion()) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  const stats = useMemo(() => {
    const list = vehicles || [];
    const makes = new Set(list.map((v) => v.make));
    const newest = list.reduce((m, v) => Math.max(m, v.year || 0), 0);
    return [
      { label: 'Vehicles available', value: vehicles ? list.filter((v) => v.status === 'available').length : '—' },
      { label: 'Marques', value: vehicles ? makes.size : '—' },
      { label: 'Newest model year', value: vehicles && newest ? newest : '—' },
      { label: 'Contact', value: 'Direct' },
    ];
  }, [vehicles]);

  return (
    <section className="hero" ref={ref} aria-labelledby="hero-title" onPointerMove={onPointerMove}>
      <div className="hero__floor" aria-hidden="true" />
      {ready ? (
        <div className="container hero__inner">
          <motion.h1 id="hero-title" className="hero__type" style={{ y: typeY, opacity: typeOpacity }} aria-label="Introducing Excellence">
            <SplitText text="Introducing" className="hero__intro" by="word" inView={false} delay={0.1} duration={0.9} />
            <motion.span className="hero__word-wrap" style={{ x: wordX }}>
              <SplitText text="Excellence" className="hero__word" by="char" inView={false} delay={0.2} stagger={0.05} duration={1} />
              <motion.span
                className="hero__dot"
                aria-hidden="true"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, duration: 0.6, ease: EASE }}
              >
                .
              </motion.span>
            </motion.span>
          </motion.h1>

          <motion.div className="hero__car" style={{ y: carY }}>
            <motion.div className="hero__car-inner" style={{ x: carX, y: carTilt }}>
              <AnimatePresence mode="wait" initial>
                <motion.div key={car.key} className="hero__car-stage" variants={driving} initial="enter" animate="parked" exit="leave">
                  <img src={srcOf(car)} srcSet={srcSetOf(car)} sizes="(max-width: 900px) 100vw, 62vw" alt={car.alt} fetchpriority="high" decoding="sync" />
                  {/* Light sweep across the bodywork, masked to the car's silhouette */}
                  <span className="hero__sheen" aria-hidden="true" style={{ '--car-mask': `url(${srcOf(car)})` }} />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>

          <div className="hero__bottom">
            <div className="hero__copy">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7, ease: EASE }}>
                <TrustBadge />
              </motion.div>
              <SplitText as="h2" text={'Drive beyond\nlimits.'} className="hero__headline" inView={false} delay={0.9} duration={0.9} />
              <motion.div
                className="hero__copy-rest"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 1.2, ease: EASE }}
              >
                <p className="hero__sub">Discover exceptional vehicles. Experience excellence. Find your next drive.</p>
                <ul className="hero__checks">
                  <li><CircleCheck aria-hidden="true" /> Curated selection</li>
                  <li><CircleCheck aria-hidden="true" /> Full specifications</li>
                  <li><CircleCheck aria-hidden="true" /> Direct assistance</li>
                </ul>
                <div className="hero__ctas">
                  <Magnetic>
                    <a href="#collection" className="btn btn--accent btn--lg btn--shine">Explore collection</a>
                  </Magnetic>
                  <Magnetic>
                    <a href="#contact" className="btn btn--dark btn--lg">Contact us</a>
                  </Magnetic>
                </div>
              </motion.div>
            </div>

            <div className="hero__side">
              <motion.div
                className="hero__switch glass"
                role="group"
                aria-label="Featured vehicle type"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.4, ease: EASE }}
              >
                {CARS.map((c, i) => (
                  <button key={c.key} type="button" aria-pressed={i === index} className={i === index ? 'is-active' : ''} onClick={() => setIndex(i)}>
                    {c.label}
                  </button>
                ))}
                <button type="button" className="hero__pause" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play car rotation' : 'Pause car rotation'}>
                  {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                </button>
              </motion.div>

              <motion.dl
                className="hero__stats glass"
                initial={{ opacity: 0, y: 28, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, delay: 1.6, ease: EASE }}
              >
                {stats.map((s, i) => (
                  <div key={s.label} className="hero__stat">
                    <dt>{s.label}</dt>
                    <dd><CountUp value={s.value} delay={1.7 + i * 0.08} /></dd>
                  </div>
                ))}
              </motion.dl>
            </div>
          </div>
        </div>
      ) : (
        <div className="hero__inner" />
      )}
    </section>
  );
}
