import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Phone, ArrowUpRight } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import Magnetic from './motion/Magnetic';
import { lockScroll } from '../hooks/useSmoothScroll';
import { links, site } from '../config/site';

export const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/vehicles', label: 'Our Vehicles' },
  { to: '/rent', label: 'Rent a Car' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
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
            transition={{ duration: 0.3 }}
          >
            <nav aria-label="Mobile">
              <ul>
                {NAV_ITEMS.map((item, i) => (
                  <motion.li
                    key={item.to}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <NavLink to={item.to} end={item.end} className="mnav__link">
                      {item.label}
                      <ArrowUpRight aria-hidden="true" />
                    </NavLink>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <div className="mnav__foot">
              {links.tel && <a href={links.tel} className="btn btn--outline btn--block"><Phone /> Call us</a>}
              <Link to="/contact" className="btn btn--dark btn--block">Contact us</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
