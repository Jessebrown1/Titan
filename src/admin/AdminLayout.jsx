import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutGrid, CarFront, Inbox, LogOut, ExternalLink, Plus } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../hooks/useAuth';

const ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/admin/vehicles', label: 'Vehicles', icon: CarFront, end: true },
  { to: '/admin/vehicles/new', label: 'Add', icon: Plus, mobileOnly: true },
  { to: '/admin/enquiries', label: 'Enquiries', icon: Inbox },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  return (
    <div className="admin">
      <aside className="admin__side">
        <Logo to="/admin" />

        {/* Sidebar on desktop; fixed bottom tab bar on phones and tablets */}
        <nav className="admin__nav" aria-label="Admin">
          {ITEMS.map(({ to, label, icon: Icon, end, mobileOnly }) => (
            <NavLink key={to} to={to} end={end} className={`admin__link${mobileOnly ? ' admin__link--mobile' : ''}`}>
              <Icon aria-hidden="true" /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin__side-foot">
          <Link to="/admin/vehicles/new" className="btn btn--dark btn--sm btn--block admin__add"><Plus /> Add vehicle</Link>
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
