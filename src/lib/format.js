import { site } from '../config/site';

const currency = new Intl.NumberFormat(site.locale, {
  style: 'currency',
  currency: site.currency,
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat(site.locale);
const date = new Intl.DateTimeFormat(site.locale, { dateStyle: 'medium', timeStyle: 'short' });

export const formatPrice = (v) => (v == null || v === '' ? 'Price on request' : currency.format(Number(v)));
export const formatMileage = (v) => (v == null || v === '' ? '—' : `${number.format(Number(v))} ${site.distanceUnit}`);
export const formatNumber = (v) => number.format(Number(v || 0));
export const formatDate = (v) => (v ? date.format(new Date(v)) : '—');

export const vehicleTitle = (v) => (v ? `${v.year} ${v.make} ${v.model}` : '');

export const STATUS_LABEL = { available: 'Available', reserved: 'Reserved', sold: 'Sold' };
export const TRANSMISSIONS = ['Automatic', 'Manual'];
export const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'];
