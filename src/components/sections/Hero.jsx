import { useMemo, useRef } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { CircleCheck } from 'lucide-react';
import SplitText from '../motion/SplitText';
import Magnetic from '../motion/Magnetic';
import CountUp from '../motion/CountUp';
import { EASE, finePointer, prefersReducedMotion } from '../../lib/motion';

export default function Hero({ vehicles }) {
  const ref = useRef(null);
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
      <div className="container hero__inner">
        <motion.h1 id="hero-title" className="hero__type" style={{ y: typeY, opacity: typeOpacity }} aria-label="Introducing Excellence">
          <SplitText text="Introducing" className="hero__intro" by="word" inView={false} delay={0.1} duration={1} />
          <motion.span className="hero__word-wrap" style={{ x: wordX }}>
            <SplitText text="Excellence" className="hero__word" by="char" inView={false} delay={0.25} stagger={0.045} duration={1.1} />
            <motion.span
              className="hero__dot"
              aria-hidden="true"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.05, duration: 0.6, ease: EASE }}
            >
              .
            </motion.span>
          </motion.span>
        </motion.h1>

        <motion.div className="hero__car" style={{ y: carY }}>
          <motion.div className="hero__car-inner" style={{ x: carX, y: carTilt }}>
            <motion.div
              className="hero__car-stage"
              initial={{ opacity: 0, x: '18%', filter: 'blur(14px)' }}
              animate={{ opacity: 1, x: '0%', filter: 'blur(0px)' }}
              transition={{ duration: 1.6, delay: 0.5, ease: EASE }}
            >
              <img
                src="/images/hero-car.webp"
                width="1600"
                height="699"
                alt="Gloss black performance coupé photographed in a studio"
                fetchpriority="high"
              />
              {/* Light sweep across the bodywork, masked to the car's silhouette */}
              <span className="hero__sheen" aria-hidden="true" />
            </motion.div>
          </motion.div>
        </motion.div>

        <div className="hero__bottom">
          <div className="hero__copy">
            <SplitText as="h2" text={'Drive beyond\nlimits.'} className="hero__headline" inView={false} delay={0.8} />
            <motion.div
              className="hero__copy-rest"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.1, ease: EASE }}
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

          <motion.dl
            className="hero__stats glass"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 1.25, ease: EASE }}
          >
            {stats.map((s, i) => (
              <div key={s.label} className="hero__stat">
                <dt>{s.label}</dt>
                <dd><CountUp value={s.value} delay={1.3 + i * 0.1} /></dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </div>
    </section>
  );
}
