import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { EASE } from '../lib/motion';

const BG = 'https://images.unsplash.com/photo-1653407497540-26207a2408d7';
const bg = (w) => `${BG}?auto=format&fit=crop&w=${w}&q=80`;

// Full-bleed studio photograph with the brand story on one side and a glass card on the other.
export default function AuthShell({ children, eyebrow = 'Staff area' }) {
  return (
    <div className="login">
      <motion.img
        className="login__bg"
        src={bg(1600)}
        srcSet={`${bg(800)} 800w, ${bg(1200)} 1200w, ${bg(1600)} 1600w, ${bg(2200)} 2200w`}
        sizes="100vw"
        alt=""
        aria-hidden="true"
        fetchpriority="high"
        initial={{ scale: 1.12, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.4, ease: EASE }}
      />
      <div className="login__shade" aria-hidden="true" />

      <header className="login__top">
        <Link to="/" className="login__brand" aria-label="TITAN MOTORS — back to website">
          <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M3 5h22v4.2h-8.6V24h-4.8V9.2H3z" fill="currentColor" /></svg>
          <span>TITAN<em>MOTORS</em></span>
        </Link>
        <Link to="/" className="login__back"><ArrowLeft aria-hidden="true" /> <span>Back to website</span></Link>
      </header>

      <div className="login__layout">
        <motion.div
          className="login__story"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.3, ease: EASE }}
        >
          <span className="login__eyebrow">{eyebrow}</span>
          <h1 className="login__headline">The showroom,<br />behind the scenes.</h1>
          <p className="login__lede">Manage the collection, publish new arrivals and respond to every enquiry — all in one place.</p>
        </motion.div>

        <motion.div
          className="login__card"
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.45, ease: EASE }}
        >
          {children}
        </motion.div>
      </div>

      <footer className="login__foot">© {new Date().getFullYear()} TITAN MOTORS · Authorised staff only</footer>
    </div>
  );
}
