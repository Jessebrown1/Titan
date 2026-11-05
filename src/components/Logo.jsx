import { Link } from 'react-router-dom';

export default function Logo({ to = '/', light = false, onClick }) {
  return (
    <Link to={to} className={`logo${light ? ' logo--light' : ''}`} aria-label="TITAN MOTORS home" onClick={onClick}>
      <svg viewBox="0 0 28 28" aria-hidden="true" className="logo__mark">
        <path d="M3 5h22v4.2h-8.6V24h-4.8V9.2H3z" fill="currentColor" />
      </svg>
      <span className="logo__word">
        TITAN<span>MOTORS</span>
      </span>
    </Link>
  );
}
