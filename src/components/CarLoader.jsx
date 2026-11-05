// Small driving-car loader, used wherever content is loading.
export default function CarLoader({ label = 'Loading' }) {
  return (
    <div className="carload" role="status" aria-live="polite">
      <svg viewBox="0 0 240 92" aria-hidden="true">
        <path className="carload__body" d="M12 64V58c0-6 6-9 18-11l34-5c16-13 36-21 62-21h22c20 0 36 10 50 21l16 3c10 2 16 7 16 14v5c0 2-1 3-3 3h-15a20 20 0 0 0-40 0H84a20 20 0 0 0-40 0H15c-2 0-3-1-3-3Z" />
        <path className="carload__glass" d="M76 42c12-10 28-15 46-15v15Zm52-15h20c14 0 26 7 36 15h-56Z" />
        {[64, 192].map((cx) => (
          <g key={cx} className="carload__wheel" style={{ transformOrigin: `${cx}px 67px` }}>
            <circle cx={cx} cy="67" r="15" />
            <path d={`M${cx - 11} 67h22M${cx} 56v22`} />
          </g>
        ))}
      </svg>
      <span className="carload__road" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
