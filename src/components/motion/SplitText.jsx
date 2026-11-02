import { motion } from 'framer-motion';
import { EASE } from '../../lib/motion';

/**
 * Masked line-rise reveal, split by word (default) or character.
 * Screen readers get the plain text via aria-label; the animated pieces are hidden.
 * Use "\n" in text for a line break.
 */
export default function SplitText({
  text,
  as = 'span',
  by = 'word',
  className,
  delay = 0,
  stagger,
  duration = 0.9,
  inView = true,
  id,
}) {
  const Tag = motion[as];
  const step = stagger ?? (by === 'char' ? 0.035 : 0.07);
  const lines = text.split('\n');
  let i = 0;

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: step, delayChildren: delay } },
  };
  const piece = {
    hidden: { y: '110%', rotate: by === 'char' ? 0 : 4 },
    show: { y: '0%', rotate: 0, transition: { duration, ease: EASE } },
  };
  const trigger = inView
    ? { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '0px 0px -10% 0px' } }
    : { initial: 'hidden', animate: 'show' };

  return (
    <Tag id={id} className={`split ${className || ''}`} aria-label={text.replace(/\n/g, ' ')} variants={container} {...trigger}>
      {lines.map((line, li) => (
        <span key={li} className="split__line" aria-hidden="true">
          {(by === 'char' ? [...line] : line.split(' ')).map((part, pi, arr) => {
            i += 1;
            return (
              <span key={`${li}-${pi}`} className="split__mask">
                <motion.span className="split__piece" variants={piece} custom={i}>
                  {part === ' ' ? ' ' : part}
                </motion.span>
                {by === 'word' && pi < arr.length - 1 ? ' ' : null}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
