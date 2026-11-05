import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Phone, ChevronRight, House, CarFront, KeyRound, Info, MessageCircle } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import Magnetic from './motion/Magnetic';
import { lockScroll } from '../hooks/useSmoothScroll';
import { links, site } from '../config/site';

export const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true, icon: House },
  { to: '/vehicles', label: 'Our Vehicles', icon: CarFront },
  { to: '/rent', label: 'Rent a Car', icon: KeyRound },
  { to: '/about', label: 'About Us', icon: Info },
  { to: '/contact', label: 'Contact', icon: MessageCircle },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    lockScroll(open);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
      <motion.div
        className="nav__bar glass"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <Logo />
        <nav className="nav__links" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="nav__link">
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <motion.span layoutId="nav-active" className="nav__active" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="nav__actions">
          <ThemeToggle />
          {links.tel && (
            <a href={links.tel} className="nav__icon" aria-label={`Call ${site.name}`}>
              <Phone aria-hidden="true" />
            </a>
          )}
          <Magnetic className="nav__cta">
            <Link to="/contact" className="btn btn--dark btn--sm">
              Contact us
            </Link>
          </Magnetic>
          <button
            type="button"
            className="nav__burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="mnav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="mnav__panel"
              initial={{ opacity: 0, y: -18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <nav aria-label="Mobile">
                <ul>
                  {NAV_ITEMS.map(({ to, end, label, icon: Icon }, i) => (
                    <motion.li
                      key={to}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <NavLink to={to} end={end} className="mnav__link" onClick={() => setOpen(false)}>
                        <span className="mnav__icon"><Icon aria-hidden="true" /></span>
                        <span className="mnav__label">{label}</span>
                        <ChevronRight className="mnav__go" aria-hidden="true" />
                      </NavLink>
                    </motion.li>
                  ))}
                </ul>
              </nav>
              <motion.div
                className="mnav__foot"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.35 }}
              >
                {links.tel && <a href={links.tel} className="btn btn--outline btn--sm btn--block"><Phone /> Call us</a>}
                <Link to="/contact" className="btn btn--dark btn--sm btn--block" onClick={() => setOpen(false)}>Contact us</Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
