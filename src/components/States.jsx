import { AlertTriangle, SearchX } from 'lucide-react';

export function Loading({ label = 'Loading' }) {
  return (
    <div className="state" role="status" aria-live="polite" style={{ borderStyle: 'none' }}>
      <div className="spinner" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', children, icon: Icon = SearchX, action }) {
  return (
    <div className="state">
      <Icon aria-hidden="true" />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <AlertTriangle aria-hidden="true" />
      <h3>Something went wrong</h3>
      <p>{error?.message || 'We could not load this content. Please try again.'}</p>
      {onRetry && (
        <button type="button" className="btn btn--outline btn--sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function CardSkeletons({ count = 3 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="vcard vcard--skeleton" aria-hidden="true">
      <div className="skeleton" style={{ aspectRatio: '4 / 3' }} />
      <div className="skeleton" style={{ height: 22, width: '60%', marginTop: 22 }} />
      <div className="skeleton" style={{ height: 16, width: '40%', marginTop: 12 }} />
    </div>
  ));
}
