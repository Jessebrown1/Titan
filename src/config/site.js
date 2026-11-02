// Company details are read from environment variables (see .env.example).
// Anything left blank is treated as "not yet configured" and hidden or
// replaced with an honest fallback in the UI — no invented contact details.
const env = import.meta.env;
const clean = (v) => (typeof v === 'string' ? v.trim() : '');

const phone = clean(env.VITE_COMPANY_PHONE);
// wa.me needs the full international number; a local Ghana number (024…) gets 233.
const toWhatsApp = (v) => {
  const digits = v.replace(/[^\d]/g, '');
  return /^0\d{9}$/.test(digits) ? `233${digits.slice(1)}` : digits.replace(/^00/, '');
};
const whatsapp = toWhatsApp(clean(env.VITE_COMPANY_WHATSAPP) || phone); // defaults to the phone number
const email = clean(env.VITE_COMPANY_EMAIL);
const address = clean(env.VITE_COMPANY_ADDRESS);

export const site = {
  name: 'TITAN MOTORS',
  tagline: 'Driven by excellence.',
  description:
    'Discover exceptional vehicles. Experience excellence. Find your next drive.',
  url: clean(env.VITE_SITE_URL),
  phone,
  whatsapp,
  email,
  address,
  hours: clean(env.VITE_COMPANY_HOURS),
  social: {
    instagram: clean(env.VITE_SOCIAL_INSTAGRAM),
    facebook: clean(env.VITE_SOCIAL_FACEBOOK),
    x: clean(env.VITE_SOCIAL_X),
    youtube: clean(env.VITE_SOCIAL_YOUTUBE),
  },
  currency: clean(env.VITE_CURRENCY) || 'GHS',
  locale: clean(env.VITE_LOCALE) || 'en-GH',
  distanceUnit: clean(env.VITE_DISTANCE_UNIT) === 'mi' ? 'mi' : 'km',
};

export const links = {
  tel: phone ? `tel:${phone.replace(/\s+/g, '')}` : null,
  mail: (subject, body) =>
    email
      ? `mailto:${email}?subject=${encodeURIComponent(subject || '')}${
          body ? `&body=${encodeURIComponent(body)}` : ''
        }`
      : null,
  whatsapp: (text) =>
    whatsapp ? `https://wa.me/${whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}` : null,
  map: address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null,
};

export const hasAnyContact = Boolean(phone || whatsapp || email);
