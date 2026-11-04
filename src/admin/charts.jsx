import { useState } from 'react';

// Column chart for a single series over time. Hover/focus a column for its value;
// the same numbers are exposed to screen readers as a table.
export function ColumnChart({ data, caption, unit = '' }) {
  const [active, setActive] = useState(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const peak = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -1) ? i : best), 0);
  const shown = active ?? (data[peak]?.value ? peak : null);

  return (
    <figure className="cols" onMouseLeave={() => setActive(null)}>
      <div className="cols__readout" aria-hidden="true">
        {shown != null ? (
          <><strong>{data[shown].value}</strong> {unit}{data[shown].value === 1 ? '' : 's'} · {data[shown].full}</>
        ) : <>No {unit}s in this period</>}
      </div>
      <div className="cols__plot" aria-hidden="true">
        {data.map((d, i) => (
          <button
            key={d.full}
            type="button"
            tabIndex={-1}
            className={`cols__slot${shown === i ? ' is-active' : ''}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
          >
            <span className="cols__bar" style={{ height: d.value ? `${Math.max(6, (d.value / max) * 100)}%` : 0 }} />
          </button>
        ))}
      </div>
      <div className="cols__axis" aria-hidden="true">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>Today</span>
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {data.map((d) => <tr key={d.full}><th scope="row">{d.full}</th><td>{d.value}</td></tr>)}
        </tbody>
      </table>
    </figure>
  );
}

// Ranked horizontal bars: label on the left, value at the tip.
export function BarList({ data, caption }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure className="barlist">
      <table>
        <caption className="sr-only">{caption}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label} title={`${d.label}: ${d.value}`}>
              <th scope="row">{d.label}</th>
              <td className="barlist__track">
                <span className="barlist__bar" style={{ width: `${Math.max(3, (d.value / max) * 100)}%` }} />
              </td>
              <td className="barlist__value">{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
