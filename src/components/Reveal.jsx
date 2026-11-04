import { motion } from 'framer-motion';

// Calm, one-time fade-and-rise as content enters the viewport.
export default function Reveal({ as = 'div', delay = 0, y = 16, children, className, ...rest }) {
  const Component = motion[as] || motion.div;
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.5, delay: delay * 0.6, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </Component>
  );
}
