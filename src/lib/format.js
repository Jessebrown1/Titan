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
const compact = new Intl.NumberFormat(site.locale, {
  style: 'currency', currency: site.currency, notation: 'compact', maximumFractionDigits: 1,
});
export const formatCompact = (v) => compact.format(Number(v || 0));
export const formatNumber = (v) => number.format(Number(v || 0));
export const formatDate = (v) => (v ? date.format(new Date(v)) : '—');

export const formatRate = (v) => `${formatPrice(v)} / day`;
export const isRentable = (v) => Boolean(v?.for_rent && v.rent_per_day > 0 && v.status !== 'sold');
export const isForSale = (v) => v?.for_sale !== false;

export const vehicleTitle = (v) => (v ? `${v.year} ${v.make} ${v.model}` : '');

export const STATUS_LABEL = { available: 'Available', reserved: 'Reserved', sold: 'Sold' };
export const TRANSMISSIONS = ['Automatic', 'Manual'];
export const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'];
