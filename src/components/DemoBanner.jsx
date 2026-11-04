import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/backend';

// Shown while the site runs on bundled sample data, so nobody mistakes it for live stock.
export default function DemoBanner() {
  const [hidden, setHidden] = useState(() => sessionStorage.getItem('demo-banner') === 'hidden');
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  // On the homepage, wait until the hero has scrolled away so it never covers the CTAs.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (isSupabaseConfigured || hidden || (pathname === '/' && !scrolled)) return null;
  return (
    <div className="demo-banner glass" role="note">
      <span className="demo-tag">Demo</span>
      <p>Showing sample vehicles. Connect Supabase to manage real inventory.</p>
      <button
        type="button"
        aria-label="Dismiss notice"
        onClick={() => {
          try { sessionStorage.setItem('demo-banner', 'hidden'); } catch { /* ignore */ }
          setHidden(true);
        }}
      >
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
