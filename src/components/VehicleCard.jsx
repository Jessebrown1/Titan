import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Gauge, Cog, Fuel } from 'lucide-react';
import { formatMileage, formatPrice, formatRate, isForSale, isRentable, STATUS_LABEL } from '../lib/format';
import { img, srcSet } from '../lib/image';
import TiltCard from './motion/TiltCard';

export default function VehicleCard({ vehicle, index = 0, mode = 'all' }) {
  const v = vehicle;
  const rentable = isRentable(v);
  const showRent = rentable && (mode === 'rent' || !isForSale(v));
  const title = `${v.year} ${v.make} ${v.model}`;
  return (
    <motion.article
      className={`vcard${v.status === 'sold' ? ' vcard--sold' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -30px 0px' }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard className="vcard__tilt">
      <Link to={`/vehicles/${v.id}${mode === 'rent' ? '?mode=rent' : ''}`} className="vcard__link" aria-label={`View details: ${title}`}>
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
            {v.status !== 'available' && <span className={`badge badge--${v.status}`}>{STATUS_LABEL[v.status]}</span>}
            {rentable && <span className="badge badge--rent badge--plain">For rent</span>}
            {v.is_demo && <span className="demo-tag">Demo</span>}
          </div>
        </div>
        <div className="vcard__body">
          <div className="vcard__head">
            <div>
              <p className="vcard__make">{v.make} · {v.year}</p>
              <h3 className="vcard__model">{v.model}</h3>
            </div>
            <div className="vcard__pricing">
              <p className="vcard__price">{showRent ? formatRate(v.rent_per_day) : formatPrice(v.price)}</p>
              {rentable && !showRent && <p className="vcard__rate">or {formatRate(v.rent_per_day)}</p>}
            </div>
          </div>
          <ul className="vcard__specs" aria-label="Key specifications">
            <li><Gauge aria-hidden="true" />{formatMileage(v.mileage)}</li>
            <li><Cog aria-hidden="true" />{v.transmission}</li>
            <li><Fuel aria-hidden="true" />{v.fuel_type}</li>
          </ul>
          <span className="vcard__cta">
            View details <ArrowUpRight aria-hidden="true" />
          </span>
        </div>
      </Link>
      </TiltCard>
    </motion.article>
  );
}
