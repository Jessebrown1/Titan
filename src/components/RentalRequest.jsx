import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Check, Info, MessageCircle, Send, UserRound } from 'lucide-react';
import { getBookedDates, submitRentalRequest } from '../services/enquiries';
import { isSupabaseConfigured } from '../lib/backend';
import { formatPrice, formatRate, vehicleTitle } from '../lib/format';
import { links, site } from '../config/site';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s().-]{6,19}$/;
const DAY = 86400000;

const isoDate = (d) => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const prettyDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(site.locale, { day: 'numeric', month: 'short' });

export default function RentalRequest({ vehicle }) {
  const today = useMemo(() => isoDate(new Date()), []);
  const [v, setV] = useState({ start: '', end: '', driver: false, name: '', email: '', phone: '', notes: '', company: '' });
  const [booked, setBooked] = useState([]);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error | offline
  const title = vehicleTitle(vehicle);

  useEffect(() => {
    let active = true;
    getBookedDates(vehicle.id).then((ranges) => active && setBooked(ranges)).catch(() => {});
    return () => { active = false; };
  }, [vehicle.id]);

  const days = v.start && v.end && v.end >= v.start
    ? Math.max(1, Math.round((new Date(v.end) - new Date(v.start)) / DAY))
    : 0;
  const clash = v.start && v.end && booked.find((b) => v.start <= b.rent_end && v.end >= b.rent_start);
  const set = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setV((s) => {
      const next = { ...s, [k]: value };
      if (k === 'start' && s.end && s.end < value) next.end = value;
      return next;
    });
  };

  const summary = `${title}: ${v.start} to ${v.end} (${days} ${days === 1 ? 'day' : 'days'})${v.driver ? ', with a driver' : ', self-drive'}`;

  async function onSubmit(e) {
    e.preventDefault();
    if (v.company) return; // honeypot
    const errs = {};
    if (!v.start || v.start < today) errs.start = 'Choose a pick-up date from today onwards.';
    if (!v.end || v.end < v.start) errs.end = 'Choose a return date after pick-up.';
    if (clash) errs.end = 'This car is already booked on those dates.';
    if (v.name.trim().length < 2) errs.name = 'Please enter your full name.';
    if (!PHONE_RE.test(v.phone.trim())) errs.phone = 'Please enter a valid phone number.';
    if (!EMAIL_RE.test(v.email.trim())) errs.email = 'Please enter a valid email address.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!isSupabaseConfigured) {
      setStatus('offline');
      return;
    }
    setStatus('sending');
    try {
      await submitRentalRequest({
        full_name: v.name.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        vehicle_id: vehicle.id,
        vehicle_interest: title,
        rent_start: v.start,
        rent_end: v.end,
        with_driver: v.driver,
        message: `Rental request for ${summary}.${v.notes.trim() ? ` Notes: ${v.notes.trim()}` : ''}`,
      });
      setStatus('sent');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    const wa = links.whatsapp(`Hello ${site.name}, I just requested a rental: ${summary}.`);
    return (
      <motion.div className="form-success rental__done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} role="status">
        <span className="form-success__icon"><Check aria-hidden="true" /></span>
        <h3>Request received.</h3>
        <p className="muted">We&rsquo;ll check availability for {prettyDate(v.start)} to {prettyDate(v.end)} and contact you to confirm. Your booking isn&rsquo;t final until then.</p>
        {wa && <a className="btn btn--outline btn--sm" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle /> Follow up on WhatsApp</a>}
      </motion.div>
    );
  }

  const err = (k) => errors[k] && <span className="field__error">{errors[k]}</span>;

  return (
    <form className="rental" onSubmit={onSubmit} noValidate>
      <div className="rental__dates">
        <div className="field">
          <label className="field__label" htmlFor="rq-start">Pick-up</label>
          <input id="rq-start" className="input" type="date" min={today} value={v.start} onChange={set('start')} aria-invalid={Boolean(errors.start)} />
          {err('start')}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="rq-end">Return</label>
          <input id="rq-end" className="input" type="date" min={v.start || today} value={v.end} onChange={set('end')} aria-invalid={Boolean(errors.end)} />
          {err('end')}
        </div>
      </div>

      {booked.length > 0 && (
        <p className="rental__booked">
          <Calendar aria-hidden="true" /> Already booked: {booked.map((b) => `${prettyDate(b.rent_start)} – ${prettyDate(b.rent_end)}`).join(', ')}
        </p>
      )}

      <label className="rental__driver">
        <input type="checkbox" checked={v.driver} onChange={set('driver')} />
        <UserRound aria-hidden="true" />
        <span>I&rsquo;d like a driver<small>Driver cost is confirmed by our team</small></span>
      </label>

      <div className="rental__total" aria-live="polite">
        <div>
          <span>{days ? `${days} ${days === 1 ? 'day' : 'days'} × ${formatRate(vehicle.rent_per_day)}` : formatRate(vehicle.rent_per_day)}</span>
          <strong>{days ? formatPrice(days * vehicle.rent_per_day) : 'Choose your dates'}</strong>
        </div>
        <small>Estimate only. Nothing is paid online.</small>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="rq-name">Full name</label>
        <input id="rq-name" className="input" autoComplete="name" value={v.name} onChange={set('name')} aria-invalid={Boolean(errors.name)} />
        {err('name')}
      </div>
      <div className="rental__dates">
        <div className="field">
          <label className="field__label" htmlFor="rq-phone">Phone</label>
          <input id="rq-phone" className="input" type="tel" autoComplete="tel" inputMode="tel" value={v.phone} onChange={set('phone')} aria-invalid={Boolean(errors.phone)} />
          {err('phone')}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="rq-email">Email</label>
          <input id="rq-email" className="input" type="email" autoComplete="email" inputMode="email" value={v.email} onChange={set('email')} aria-invalid={Boolean(errors.email)} />
          {err('email')}
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="rq-notes">Notes (optional)</label>
        <input id="rq-notes" className="input" placeholder="Pick-up location, trip details…" maxLength={500} value={v.notes} onChange={set('notes')} />
      </div>

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="rq-company">Company</label>
        <input id="rq-company" tabIndex={-1} autoComplete="off" value={v.company} onChange={set('company')} />
      </div>

      {status === 'offline' && (
        <p className="notice notice--warning"><Info aria-hidden="true" /> Online rental requests aren&rsquo;t connected yet, so this hasn&rsquo;t been sent.</p>
      )}
      {status === 'error' && (
        <p className="notice notice--error" role="alert"><Info aria-hidden="true" /> We couldn&rsquo;t send your request. Please try again or contact us directly.</p>
      )}

      <button type="submit" className="btn btn--accent btn--lg btn--block" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : <>Request this rental <Send aria-hidden="true" /></>}
      </button>
    </form>
  );
}
