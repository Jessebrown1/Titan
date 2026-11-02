// Slow, endless band of the marques currently in the collection.
export default function Marquee({ vehicles }) {
  const makes = [...new Set((vehicles || []).map((v) => v.make))];
  if (makes.length < 2) return null;
  const row = [...makes, ...makes, ...makes];
  return (
    <section className="marquee" aria-label={`Marques in our collection: ${makes.join(', ')}`}>
      <div className="marquee__track" aria-hidden="true">
        {[0, 1].map((copy) => (
          <ul key={copy} className="marquee__group">
            {row.map((m, i) => (
              <li key={`${copy}-${i}`}>
                <span>{m}</span>
                <i className="marquee__sep" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
