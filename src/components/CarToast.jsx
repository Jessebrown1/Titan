import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const SHOW_MS = 7000;
const EASE = [0.22, 1, 0.36, 1];

// Confirmation toast: a small car drives in and parks beside the message.
export default function CarToast({ title, children }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), SHOW_MS);
    return () => clearTimeout(timer);
  }, []);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="ctoast"
          role="status"
          initial={{ opacity: 0, y: -24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="ctoast__road" aria-hidden="true">
            <motion.svg
              viewBox="0 0 240 92"
              initial={{ x: -90 }}
              animate={{ x: 0 }}
              transition={{ duration: 1.1, delay: 0.15, ease: EASE }}
            >
              <path d="M12 64V58c0-6 6-9 18-11l34-5c16-13 36-21 62-21h22c20 0 36 10 50 21l16 3c10 2 16 7 16 14v5c0 2-1 3-3 3h-15a20 20 0 0 0-40 0H84a20 20 0 0 0-40 0H15c-2 0-3-1-3-3Z" />
              <circle cx="64" cy="67" r="13" />
              <circle cx="192" cy="67" r="13" />
            </motion.svg>
          </div>
          <div className="ctoast__text">
            <strong>{title}</strong>
            <span>{children}</span>
          </div>
          <button type="button" className="ctoast__close" onClick={() => setOpen(false)} aria-label="Dismiss notification">
            <X aria-hidden="true" />
          </button>
          <motion.span
            className="ctoast__timer"
            aria-hidden="true"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: SHOW_MS / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
