import { motion } from 'framer-motion';
import { EASE } from '../../lib/motion';

// Unveils an image with a clip-path wipe while it settles from a slight zoom.
export default function ImageReveal({ src, alt, className, delay = 0, from = 'bottom', ...imgProps }) {
  const hidden = {
    bottom: 'inset(100% 0% 0% 0%)',
    left: 'inset(0% 100% 0% 0%)',
    right: 'inset(0% 0% 0% 100%)',
  }[from];
  return (
    <motion.div
      className={`img-reveal ${className || ''}`}
      initial={{ clipPath: hidden }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 1.3, delay, ease: EASE }}
    >
      <motion.img
        src={src}
        alt={alt}
        initial={{ scale: 1.25 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '0px 0px -12% 0px' }}
        transition={{ duration: 1.8, delay, ease: EASE }}
        {...imgProps}
      />
    </motion.div>
  );
}
