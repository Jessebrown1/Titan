import { motion } from 'framer-motion';
import { img } from '../lib/image';

const EASE = [0.22, 1, 0.36, 1];
const rise = (delay) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: EASE },
});

// Dark confirmation card shared by the enquiry and rental forms.
export default function SuccessPanel({ eyebrow, title, children, details, actions, car }) {
  return (
    <motion.div className="success" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, ease: EASE }}>
      {car && (
        <motion.div className="success__car" {...rise(0.1)}>
          <img src={img(car.main_image, 720)} alt={`${car.year} ${car.make} ${car.model}`} />
          <span>{car.year} {car.make} {car.model}</span>
        </motion.div>
      )}
      <svg className="success__mark" viewBox="0 0 64 64" aria-hidden="true">
        <circle className="success__ring-bg" cx="32" cy="32" r="29" />
        <motion.circle
          className="success__ring"
          cx="32"
          cy="32"
          r="29"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
        />
        <motion.path
          className="success__check"
          d="M21 33l8 8 15-17"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.75, ease: EASE }}
        />
      </svg>
      <motion.p className="success__eyebrow" {...rise(0.25)}>{eyebrow}</motion.p>
      <motion.h3 className="success__title" {...rise(0.32)}>{title}</motion.h3>
      <motion.p className="success__text" {...rise(0.4)}>{children}</motion.p>
      {details && (
        <motion.dl className="success__details" {...rise(0.48)}>
          {details.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </motion.dl>
      )}
      {actions && <motion.div className="success__actions" {...rise(0.56)}>{actions}</motion.div>}
    </motion.div>
  );
}
