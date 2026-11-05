import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck, KeyRound, MessageSquare, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SHOW_MS = 9000;
const KINDS = {
  rental: { title: 'New rental request', icon: KeyRound, to: '/admin/rentals?status=new' },
  test_drive: { title: 'New test drive request', icon: CalendarCheck, to: '/admin/rentals?kind=test_drive&status=new' },
  sale: { title: 'New enquiry', icon: MessageSquare, to: '/admin/enquiries?status=new' },
};

// Two soft notes. Browsers stay silent until the admin has interacted with the page.
function useChime() {
  const context = useRef(null);
  useEffect(() => {
    const unlock = () => {
      context.current = context.current || new (window.AudioContext || window.webkitAudioContext)();
      context.current.resume?.();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);
  return () => {
    const ctx = context.current;
    if (!ctx) return;
    [[880, 0], [1318.5, 0.14]].forEach(([freq, at]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.45);
    });
  };
}

// Listens for new website messages while the admin is open.
export default function LiveAlerts() {
  const [alerts, setAlerts] = useState([]);
  const chime = useChime();
  const chimeRef = useRef(chime);
  chimeRef.current = chime;
  const dismiss = (id) => setAlerts((list) => list.filter((a) => a.id !== id));

  useEffect(() => {
    const channel = supabase
      .channel('admin-new-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'enquiries' }, ({ new: row }) => {
        setAlerts((list) => [row, ...list].slice(0, 3));
        setTimeout(() => dismiss(row.id), SHOW_MS);
        chimeRef.current();
        window.dispatchEvent(new Event('titan:new-message'));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="alerts" aria-live="polite">
      <AnimatePresence initial={false}>
        {alerts.map((row) => {
          const kind = KINDS[row.type] || KINDS.sale;
          const Icon = kind.icon;
          return (
            <motion.div
              key={row.id}
              layout
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="alert__wrap"
            >
              <Link to={kind.to} className="alert" onClick={() => dismiss(row.id)}>
                <span className="alert__icon"><Icon aria-hidden="true" /></span>
                <span className="alert__text">
                  <strong>{kind.title}</strong>
                  <span>{[row.full_name, row.vehicle_interest].filter(Boolean).join(' · ')}</span>
                </span>
                <motion.i className="alert__timer" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: SHOW_MS / 1000, ease: 'linear' }} />
              </Link>
              <button type="button" className="alert__close" aria-label="Dismiss" onClick={() => dismiss(row.id)}>
                <X aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
