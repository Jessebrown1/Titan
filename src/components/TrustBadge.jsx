import { ShieldCheck } from 'lucide-react';

// Dealer trust mark. `compact` is the small version used on vehicle photos.
export default function TrustBadge({ compact = false, className = '' }) {
  return (
    <span className={`trust${compact ? ' trust--compact' : ''} ${className}`}>
      <ShieldCheck aria-hidden="true" />
      <span>{compact ? 'Trusted' : 'Trusted dealer'}</span>
    </span>
  );
}
