import { motion } from 'framer-motion';
import Reveal from './Reveal';
import SplitText from './motion/SplitText';

export default function PageHeader({ eyebrow, title, children, word }) {
  return (
    <header className="page-header">
      {word && (
        <motion.span
          className="page-header__word"
          aria-hidden="true"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
        </motion.span>
      )}
      <div className="container">
        <Reveal><span className="eyebrow">{eyebrow}</span></Reveal>
        <SplitText as="h1" className="display-xl" text={title} inView={false} delay={0.1} />
        {children && <Reveal delay={0.1}><p className="lead">{children}</p></Reveal>}
      </div>
    </header>
  );
}
