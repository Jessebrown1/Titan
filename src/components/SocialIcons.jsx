import { site } from '../config/site';

// Minimal brand-neutral glyphs; links render only when configured in .env.
const ICONS = {
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></>,
  facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5a.5.5 0 0 1 .5-.5Z" />,
  x: <path d="M4 4l16 16M20 4 4 20" />,
  youtube: <><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" /></>,
};
const LABELS = { instagram: 'Instagram', facebook: 'Facebook', x: 'X', youtube: 'YouTube' };

export default function SocialIcons() {
  const entries = Object.entries(site.social).filter(([, url]) => url);
  if (!entries.length) return null;
  return (
    <ul className="social">
      {entries.map(([key, url]) => (
        <li key={key}>
          <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${site.name} on ${LABELS[key]}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {ICONS[key]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
