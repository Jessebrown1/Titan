import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Gauge, Cog, Fuel, KeyRound } from 'lucide-react';
import TiltCard from './motion/TiltCard';
import TrustBadge from './TrustBadge';
import { formatMileage, formatPrice, STATUS_LABEL } from '../lib/format';
import { img, srcSet } from '../lib/image';

export default function VehicleCard({ vehicle, index = 0 }) {
  const v = vehicle;
  const title = `${v.year} ${v.make} ${v.model}`;
  const rent = Boolean(v.for_rent);
  return (
    <motion.article
      className={`vcard${v.status === 'sold' ? ' vcard--sold' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -30px 0px' }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard className="vcard__tilt">
        <Link to={`/vehicles/${v.id}`} className="vcard__link" aria-label={`View details: ${title}${rent ? ', for rent' : ''}`}>
          <div className="vcard__media">
            <img
              src={img(v.main_image, 900)}
              srcSet={srcSet(v.main_image, [480, 720, 900, 1200])}
              sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 30vw"
              alt={`${title}${v.colour ? ` in ${v.colour}` : ''}`}
              loading="lazy"
              decoding="async"
            />
            <div className="vcard__tags">
              {rent && <span className="vbadge vbadge--rent"><KeyRound aria-hidden="true" /> For rent</span>}
              {v.status !== 'available' && <span className={`vbadge vbadge--${v.status}`}>{STATUS_LABEL[v.status]}</span>}
            </div>
            <TrustBadge compact className="vcard__trust" />
          </div>

          <div className="vcard__body">
            <p className="vcard__make">{v.make} · {v.year}</p>
            <h3 className="vcard__model" title={v.model}>{v.model}</h3>
            <p className="vcard__price">
              {formatPrice(rent ? v.rent_per_day : v.price)}
              {rent && <small>per day</small>}
            </p>
            <ul className="vcard__specs" aria-label="Key specifications">
              <li><Gauge aria-hidden="true" /><span>{formatMileage(v.mileage)}</span></li>
              <li><Cog aria-hidden="true" /><span>{v.transmission}</span></li>
              <li><Fuel aria-hidden="true" /><span>{v.fuel_type}</span></li>
            </ul>
            <span className="vcard__cta">
              {rent ? 'Rent this car' : 'View details'} <ArrowRight aria-hidden="true" />
            </span>
          </div>
        </Link>
      </TiltCard>
    </motion.article>
  );
}
