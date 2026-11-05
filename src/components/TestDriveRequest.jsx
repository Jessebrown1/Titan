import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Info, Send } from 'lucide-react';
import { getTakenDriveSlots, submitTestDrive } from '../services/enquiries';
import { isSupabaseConfigured } from '../lib/backend';
import { vehicleTitle } from '../lib/format';
import { site } from '../config/site';
import SuccessPanel from './SuccessPanel';
import CarToast from './CarToast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s().-]{6,19}$/;
const SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

const isoDate = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const prettyDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(site.locale, { weekday: 'short', day: 'numeric', month: 'short' });
const prettyTime = (t) => new Date(`2000-01-01T${t}:00`).toLocaleTimeString(site.locale, { hour: 'numeric', minute: '2-digit' });

export default function TestDriveRequest({ vehicle, onBack }) {
  const tomorrow = useMemo(() => isoDate(new Date(Date.now() + 86400000)), []);
  const [v, setV] = useState({ date: '', time: '', name: '', phone: '', email: '', notes: '', company: '' });
  const [taken, setTaken] = useState([]);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error | offline
  const title = vehicleTitle(vehicle);

  useEffect(() => {
    let active = true;
    getTakenDriveSlots(vehicle.id).then((rows) => active && setTaken(rows)).catch(() => {});
    return () => { active = false; };
  }, [vehicle.id]);

  const isTaken = (slot) => taken.some((t) => t.drive_date === v.date && t.drive_time === slot);
  const set = (k) => (e) => setV((s) => {
    const next = { ...s, [k]: e.target.value };
    if (k === 'date' && taken.some((t) => t.drive_date === next.date && t.drive_time === s.time)) next.time = '';
    return next;
  });

  async function onSubmit(e) {
    e.preventDefault();
    if (v.company) return; // honeypot
    const errs = {};
    if (!v.date || v.date < tomorrow) errs.date = 'Choose a date from tomorrow onwards.';
    if (!v.time) errs.time = 'Choose a time.';
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
      await submitTestDrive({
        full_name: v.name.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        vehicle_id: vehicle.id,
        vehicle_interest: title,
        drive_date: v.date,
        drive_time: v.time,
        message: `Test drive request for ${title} on ${v.date} at ${v.time}.${v.notes.trim() ? ` Notes: ${v.notes.trim()}` : ''}`,
      });
      setStatus('sent');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <>
        <SuccessPanel
          eyebrow="Test drive requested"
          title="We have your request."
          car={vehicle}
          details={[['Date', prettyDate(v.date)], ['Time', prettyTime(v.time)]]}
        >
          We&rsquo;ll reach out to you to confirm your appointment. Please bring your driving licence on the day.
        </SuccessPanel>
        <CarToast title="Request on its way">We&rsquo;ll reach out to you to confirm your test drive.</CarToast>
      </>
    );
  }

  const err = (k) => errors[k] && <span className="field__error">{errors[k]}</span>;

  return (
    <form className="rental" onSubmit={onSubmit} noValidate>
      <button type="button" className="rental__back" onClick={onBack}><ArrowLeft aria-hidden="true" /> Back</button>
      <h2 className="rental__title">Book a test drive</h2>

      <div className="rental__dates">
        <div className="field">
          <label className="field__label" htmlFor="td-date">Date</label>
          <input id="td-date" className="input" type="date" min={tomorrow} value={v.date} onChange={set('date')} aria-invalid={Boolean(errors.date)} />
          {err('date')}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="td-time">Time</label>
          <select id="td-time" className="select" value={v.time} onChange={set('time')} aria-invalid={Boolean(errors.time)}>
            <option value="">Choose</option>
            {SLOTS.map((slot) => <option key={slot} value={slot} disabled={isTaken(slot)}>{prettyTime(slot)}{isTaken(slot) ? ' (taken)' : ''}</option>)}
          </select>
          {err('time')}
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="td-name">Full name</label>
        <input id="td-name" className="input" autoComplete="name" value={v.name} onChange={set('name')} aria-invalid={Boolean(errors.name)} />
        {err('name')}
      </div>
      <div className="rental__dates">
        <div className="field">
          <label className="field__label" htmlFor="td-phone">Phone</label>
          <input id="td-phone" className="input" type="tel" autoComplete="tel" inputMode="tel" placeholder="With country code" value={v.phone} onChange={set('phone')} aria-invalid={Boolean(errors.phone)} />
          {err('phone')}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="td-email">Email</label>
          <input id="td-email" className="input" type="email" autoComplete="email" inputMode="email" value={v.email} onChange={set('email')} aria-invalid={Boolean(errors.email)} />
          {err('email')}
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="td-notes">Notes (optional)</label>
        <input id="td-notes" className="input" maxLength={500} value={v.notes} onChange={set('notes')} />
      </div>

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="td-company">Company</label>
        <input id="td-company" tabIndex={-1} autoComplete="off" value={v.company} onChange={set('company')} />
      </div>

      {status === 'offline' && <p className="notice notice--warning"><Info aria-hidden="true" /> Online booking isn&rsquo;t connected yet, so this hasn&rsquo;t been sent.</p>}
      {status === 'error' && <p className="notice notice--error" role="alert"><Info aria-hidden="true" /> We couldn&rsquo;t send your request. Please try again or contact us directly.</p>}

      <button type="submit" className="btn btn--accent btn--lg btn--block" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : <>Request test drive <Send aria-hidden="true" /></>}
      </button>
      <p className="field__hint">Our team confirms every appointment. Please bring your driving licence.</p>
    </form>
  );
}
