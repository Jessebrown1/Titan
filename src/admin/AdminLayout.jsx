import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, CarFront, KeyRound, Inbox, LogOut, ExternalLink, Plus, Smartphone } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../hooks/useAuth';
import { listAllMessages } from '../services/enquiriesAdmin';
import LiveAlerts from './LiveAlerts';

const ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/admin/vehicles', label: 'Vehicles', icon: CarFront, end: true },
  { to: '/admin/vehicles/new', label: 'Add', icon: Plus, mobileOnly: true },
  { to: '/admin/rentals', label: 'Bookings', icon: KeyRound, count: 'rental' },
  { to: '/admin/enquiries', label: 'Enquiries', icon: Inbox, count: 'sale' },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const [counts, setCounts] = useState({ rental: 0, sale: 0 });
  const [tick, setTick] = useState(0);

  // New-message badges; refreshed whenever the admin moves between pages.
  useEffect(() => {
    let active = true;
    listAllMessages()
      .then((all) => {
        if (!active) return;
        const fresh = all.filter((m) => m.status === 'new');
        setCounts({ rental: fresh.filter((m) => m.type !== 'sale').length, sale: fresh.filter((m) => m.type === 'sale').length });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [pathname, tick]);

  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    window.addEventListener('titan:new-message', refresh);
    return () => window.removeEventListener('titan:new-message', refresh);
  }, []);

  return (
    <div className="admin">
      <LiveAlerts />
      <aside className="admin__side">
        <Logo to="/admin" />

        {/* Sidebar on desktop; fixed bottom tab bar on phones and tablets */}
        <nav className="admin__nav" aria-label="Admin">
          {ITEMS.map(({ to, label, icon: Icon, end, mobileOnly, count }) => (
            <NavLink key={to} to={to} end={end} className={`admin__link${mobileOnly ? ' admin__link--mobile' : ''}`}>
              <Icon aria-hidden="true" /> <span>{label}</span>
              {count && counts[count] > 0 && <b className="admin__count" aria-label={`${counts[count]} new`}>{counts[count]}</b>}
            </NavLink>
          ))}
        </nav>

        <div className="admin__side-foot">
          <Link to="/admin/vehicles/new" className="btn btn--dark btn--sm btn--block admin__add"><Plus /> Add vehicle</Link>
          <NavLink to="/admin/app" className="admin__link admin__link--icon" aria-label="Get the app">
            <Smartphone aria-hidden="true" /> <span>Get the app</span>
          </NavLink>
          <a href="/" target="_blank" rel="noopener noreferrer" className="admin__link admin__link--site" aria-label="View website">
            <ExternalLink aria-hidden="true" /> <span>View website</span>
          </a>
          <ThemeToggle className="admin__link admin__link--icon" withLabel />
          <p className="admin__user" title={user?.email}>{user?.email}</p>
          <button type="button" className="admin__link admin__link--icon" onClick={signOut} aria-label="Sign out">
            <LogOut aria-hidden="true" /> <span>Sign out</span>
          </button>
        </div>
      </aside>
      <main className="admin__main" id="main">
        <Outlet />
      </main>
    </div>
  );
}
