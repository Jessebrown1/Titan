import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Info, Send, Mail, MessageCircle } from 'lucide-react';
import { submitEnquiry } from '../services/enquiries';
import { isSupabaseConfigured } from '../lib/backend';
import { links, site } from '../config/site';

const EMPTY = { full_name: '', email: '', phone: '', vehicle_interest: '', message: '', company: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s().-]{6,19}$/;

function validate(v) {
  const e = {};
  if (v.full_name.trim().length < 2) e.full_name = 'Please enter your full name.';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Please enter a valid email address.';
  if (v.phone.trim() && !PHONE_RE.test(v.phone.trim())) e.phone = 'Please enter a valid phone number.';
  if (v.message.trim().length < 10) e.message = 'Please write a short message (at least 10 characters).';
  if (v.message.length > 2000) e.message = 'Please keep your message under 2000 characters.';
  return e;
}

export default function ContactForm({ defaultVehicle = '', vehicleId = null, vehicleOptions = [] }) {
  const [values, setValues] = useState({ ...EMPTY, vehicle_interest: defaultVehicle });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error | offline
  const [serverError, setServerError] = useState('');

  const liveErrors = useMemo(() => validate(values), [values]);
  const showError = (k) => (touched[k] || status === 'invalid') && (errors[k] || liveErrors[k]);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const composed = `Hello ${site.name},\n\nName: ${values.full_name}\nEmail: ${values.email}\nPhone: ${values.phone || '—'}\nVehicle of interest: ${values.vehicle_interest || '—'}\n\n${values.message}`;

  async function onSubmit(e) {
    e.preventDefault();
    if (values.company) return; // honeypot — silently ignore bots
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setStatus('invalid');
      const first = document.getElementById(`cf-${Object.keys(errs)[0]}`);
      first?.focus();
      return;
    }
    if (!isSupabaseConfigured) {
      setStatus('offline');
      return;
    }
    setStatus('sending');
    setServerError('');
    try {
      await submitEnquiry({ ...values, vehicle_id: vehicleId });
      setStatus('sent');
      setValues({ ...EMPTY });
      setTouched({});
    } catch (err) {
      console.error(err);
      setServerError('We could not send your enquiry right now. Please try again, or contact us directly.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <motion.div className="form-success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} role="status">
        <span className="form-success__icon"><Check aria-hidden="true" /></span>
        <h3>Thank you — your enquiry has been received.</h3>
        <p className="muted">A member of our team will be in touch shortly.</p>
        <button type="button" className="btn btn--outline btn--sm" onClick={() => setStatus('idle')}>
          Send another enquiry
        </button>
      </motion.div>
    );
  }

  const field = (key, label, props = {}, required = false) => (
    <div className="field">
      <label className="field__label" htmlFor={`cf-${key}`}>
        {label}{required && <span className="req" aria-hidden="true">*</span>}
      </label>
      {props.as === 'textarea' ? (
        <textarea
          id={`cf-${key}`}
          className="textarea"
          value={values[key]}
          onChange={set(key)}
          onBlur={blur(key)}
          aria-invalid={Boolean(showError(key))}
          aria-describedby={showError(key) ? `cf-${key}-err` : undefined}
          required={required}
          maxLength={2000}
          {...props.attrs}
        />
      ) : (
        <input
          id={`cf-${key}`}
          className="input"
          value={values[key]}
          onChange={set(key)}
          onBlur={blur(key)}
          aria-invalid={Boolean(showError(key))}
          aria-describedby={showError(key) ? `cf-${key}-err` : undefined}
          required={required}
          {...props.attrs}
        />
      )}
      {showError(key) && <span className="field__error" id={`cf-${key}-err`}>{showError(key)}</span>}
    </div>
  );

  return (
    <form className="cform" onSubmit={onSubmit} noValidate>
      <div className="cform__grid">
        {field('full_name', 'Full name', { attrs: { autoComplete: 'name' } }, true)}
        {field('email', 'Email address', { attrs: { type: 'email', autoComplete: 'email', inputMode: 'email' } }, true)}
        {field('phone', 'Phone number', { attrs: { type: 'tel', autoComplete: 'tel', inputMode: 'tel' } })}
        {field('vehicle_interest', 'Vehicle of interest', { attrs: { list: 'cf-vehicles', placeholder: 'e.g. 2022 Toyota Corolla' } })}
      </div>
      <datalist id="cf-vehicles">
        {vehicleOptions.map((o) => <option key={o} value={o} />)}
      </datalist>
      {field('message', 'Message', { as: 'textarea', attrs: { placeholder: 'How can we help?' } }, true)}

      {/* Honeypot field — hidden from people, tempting to bots */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="cf-company">Company</label>
        <input id="cf-company" tabIndex={-1} autoComplete="off" value={values.company} onChange={set('company')} />
      </div>

      <AnimatePresence>
        {status === 'offline' && (
          <motion.div className="notice notice--warning" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }}>
            <Info aria-hidden="true" />
            <div>
              <strong>The online enquiry form is not connected yet.</strong> Your message has not been sent.
              {(links.mail() || links.whatsapp()) ? ' You can send it directly instead:' : ' Please check back soon.'}
              <div className="cform__fallback">
                {links.mail() && (
                  <a className="btn btn--outline btn--sm" href={links.mail(`Vehicle enquiry — ${values.vehicle_interest || site.name}`, composed)}>
                    <Mail /> Send by email
                  </a>
                )}
                {links.whatsapp() && (
                  <a className="btn btn--outline btn--sm" href={links.whatsapp(composed)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle /> Send on WhatsApp
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div className="notice notice--error" role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Info aria-hidden="true" />
            <span>{serverError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="cform__foot">
        <p className="field__hint">Fields marked * are required. We only use your details to respond to your enquiry.</p>
        <button type="submit" className="btn btn--dark btn--lg" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : <>Send enquiry <Send aria-hidden="true" /></>}
        </button>
      </div>
    </form>
  );
}
