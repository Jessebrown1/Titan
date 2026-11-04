import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Phone, Mail, CarFront, Calendar, Gauge, Cog, Fuel, Zap, Palette } from 'lucide-react';
import Gallery from '../components/Gallery';
import VehicleCard from '../components/VehicleCard';
import Reveal from '../components/Reveal';
import { Loading, EmptyState, ErrorState } from '../components/States';
import { useVehicle } from '../hooks/useVehicles';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { formatMileage, formatPrice, formatRate, isForSale, isRentable, STATUS_LABEL, vehicleTitle } from '../lib/format';
import RentalRequest from '../components/RentalRequest';
import { img } from '../lib/image';
import { links, site } from '../config/site';

export default function VehicleDetail() {
  const { id } = useParams();
  const { data: v, all, loading, error, reload } = useVehicle(id);
  const title = vehicleTitle(v);
  const [params] = useSearchParams();
  const [picked, setPicked] = useState(params.get('mode') === 'rent' ? 'rent' : null);

  useDocumentMeta({
    title: v ? title : loading ? 'Vehicle' : 'Vehicle not found',
    description: v ? `${title} — ${formatPrice(v.price)}, ${formatMileage(v.mileage)}, ${v.transmission}, ${v.fuel_type}. Enquire with TITAN MOTORS.` : undefined,
    image: v ? img(v.main_image, 1200) : undefined,
  });

  if (loading) return <div className="detail container"><Loading /></div>;
  if (error) return <div className="detail container"><ErrorState error={error} onRetry={reload} /></div>;
  if (!v) {
    return (
      <div className="detail container">
        <EmptyState
          icon={CarFront}
          title="Vehicle not found"
          action={<Link to="/vehicles" className="btn btn--dark btn--sm">Browse all vehicles</Link>}
        >
          This vehicle may have been sold or removed from our collection.
        </EmptyState>
      </div>
    );
  }

  const images = [v.main_image, ...(v.images || [])].filter(Boolean);
  const rentable = isRentable(v);
  const sale = isForSale(v);
  const mode = rentable && (picked === 'rent' || !sale) ? 'rent' : 'buy';
  const message = `Hello ${site.name}, I am interested in the ${title}. Please provide more information.`;
  const whatsapp = links.whatsapp(message);
  const mail = links.mail(`Enquiry: ${title}`, message);
  const enquireHref = whatsapp || `/contact?vehicle=${encodeURIComponent(v.id)}`;
  const specs = [
    { icon: Calendar, label: 'Year', value: v.year },
    { icon: Gauge, label: 'Mileage', value: formatMileage(v.mileage) },
    { icon: Cog, label: 'Transmission', value: v.transmission },
    { icon: Fuel, label: 'Fuel type', value: v.fuel_type },
    { icon: Zap, label: 'Engine', value: v.engine || '—' },
    { icon: Palette, label: 'Colour', value: v.colour || '—' },
  ];
  const related = (all || []).filter((o) => o.id !== v.id && o.status !== 'sold').slice(0, 3);

  return (
    <article className="detail">
      <div className="container">
        <Link to="/vehicles" className="detail__back"><ArrowLeft aria-hidden="true" /> All vehicles</Link>

        <div className="detail__grid">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <Gallery images={images} title={title} />
          </motion.div>

          <motion.aside
            className="detail__panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="detail__tags">
              <span className={`badge badge--${v.status}`}>{STATUS_LABEL[v.status]}</span>
              {v.is_demo && <span className="demo-tag">Demo listing</span>}
            </div>
            <p className="detail__make">{v.make}</p>
            <h1 className="detail__title">{v.model}</h1>
            <p className="detail__year">{v.year}{v.colour ? ` · ${v.colour}` : ''}</p>
            {rentable && sale && (
              <div className="listing-tabs detail__modes" role="group" aria-label="Buy or rent">
                {[['buy', 'Buy'], ['rent', 'Rent']].map(([value, label]) => (
                  <button key={value} type="button" aria-pressed={mode === value} className={mode === value ? 'is-active' : ''} onClick={() => setPicked(value)}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            <p className="detail__price">{mode === 'rent' ? formatRate(v.rent_per_day) : formatPrice(v.price)}</p>

            <dl className="specs glass">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="specs__item">
                  <dt><Icon aria-hidden="true" />{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            {mode === 'rent' ? <RentalRequest vehicle={v} /> : (
            <div className="detail__actions">
              {v.status === 'sold' ? (
                <p className="notice">This vehicle has been sold. Contact us and we will help you find something similar.</p>
              ) : null}
              {whatsapp ? (
                <a className="btn btn--accent btn--lg btn--block" href={enquireHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden="true" /> Enquire about this vehicle
                </a>
              ) : (
                <Link className="btn btn--accent btn--lg btn--block" to={enquireHref}>
                  <MessageCircle aria-hidden="true" /> Enquire about this vehicle
                </Link>
              )}
              <div className="detail__secondary">
                {links.tel && (
                  <a className="btn btn--outline btn--block" href={links.tel}><Phone aria-hidden="true" /> Call</a>
                )}
                {mail && (
                  <a className="btn btn--outline btn--block" href={mail}><Mail aria-hidden="true" /> Email</a>
                )}
                {!links.tel && !mail && (
                  <Link className="btn btn--outline btn--block" to={`/contact?vehicle=${encodeURIComponent(v.id)}`}>
                    <Mail aria-hidden="true" /> Enquiry form
                  </Link>
                )}
              </div>
            </div>
            )}
          </motion.aside>
        </div>

        {v.description && (
          <Reveal className="detail__description">
            <span className="eyebrow">Overview</span>
            <p>{v.description}</p>
          </Reveal>
        )}

        {related.length > 0 && (
          <section className="detail__related" aria-labelledby="related-title">
            <div className="section-head">
              <h2 id="related-title" className="display-md">You may also like</h2>
              <Link to="/vehicles" className="btn btn--outline btn--sm">View all</Link>
            </div>
            <div className="vgrid">
              {related.map((r, i) => <VehicleCard key={r.id} vehicle={r} index={i} />)}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
