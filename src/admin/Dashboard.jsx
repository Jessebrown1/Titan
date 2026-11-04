import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, CalendarCheck, CarFront, CheckCircle2, CircleDollarSign, ExternalLink, ImageOff,
  Inbox, KeyRound, MessageSquare, Phone, Plus, Sparkles, Tag,
} from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { listVehicles } from '../services/vehiclesAdmin';
import { listAllMessages, rentalDays } from '../services/enquiriesAdmin';
import { Loading, ErrorState } from '../components/States';
import { BarList, ColumnChart } from './charts';
import { formatCompact, formatDate, formatNumber, formatPrice, isForSale, isRentable, STATUS_LABEL } from '../lib/format';
import { img } from '../lib/image';
import { hasAnyContact, site } from '../config/site';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { EASE } from '../lib/motion';

const DAY = 86400000;
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  return h < 18 ? 'Good afternoon' : 'Good evening';
};
const dayKey = (d) => new Date(d).toLocaleDateString('en-CA');
const shortDay = (d, opts) => d.toLocaleDateString(site.locale, opts);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function useOverview(vehicles, messages) {
  return useMemo(() => {
    const today = dayKey(new Date());
    const now = Date.now();
    const rentals = messages.filter((m) => m.type === 'rental');
    const enquiries = messages.filter((m) => m.type !== 'rental');
    const rateOf = Object.fromEntries(vehicles.map((v) => [v.id, Number(v.rent_per_day) || 0]));

    const available = vehicles.filter((v) => v.status === 'available');
    const stockValue = available.filter(isForSale).reduce((sum, v) => sum + (Number(v.price) || 0), 0);
    const fleet = vehicles.filter(isRentable);
    const upcoming = rentals
      .filter((r) => r.status === 'confirmed' && r.rent_end >= today)
      .sort((a, b) => a.rent_start.localeCompare(b.rent_start));
    const booked = upcoming.reduce((sum, r) => sum + rentalDays(r) * (rateOf[r.vehicle_id] || 0), 0);

    const week = messages.filter((m) => now - new Date(m.created_at) < 7 * DAY).length;
    const lastWeek = messages.filter((m) => {
      const age = now - new Date(m.created_at);
      return age >= 7 * DAY && age < 14 * DAY;
    }).length;

    const daily = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now - (13 - i) * DAY);
      const key = dayKey(d);
      return {
        label: shortDay(d, { day: 'numeric', month: 'short' }),
        full: shortDay(d, { weekday: 'short', day: 'numeric', month: 'short' }),
        value: messages.filter((m) => dayKey(m.created_at) === key).length,
      };
    });

    const counts = {};
    vehicles.forEach((v) => { counts[v.make] = (counts[v.make] || 0) + 1; });
    const makes = Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    const statuses = Object.entries(STATUS_LABEL).map(([key, label]) => ({ label, value: vehicles.filter((v) => v.status === key).length }));

    const newRentals = rentals.filter((r) => r.status === 'new');
    const newEnquiries = enquiries.filter((e) => e.status === 'new');
    const attention = [
      newRentals.length && { icon: KeyRound, text: `${plural(newRentals.length, 'rental request')} to confirm`, to: '/admin/rentals?status=new', urgent: true },
      newEnquiries.length && { icon: Inbox, text: `${plural(newEnquiries.length, 'new enquiry').replace('enquirys', 'enquiries')} to answer`, to: '/admin/enquiries?status=new', urgent: true },
      vehicles.filter((v) => isForSale(v) && v.price == null).length && { icon: Tag, text: `${plural(vehicles.filter((v) => isForSale(v) && v.price == null).length, 'car')} without a price`, to: '/admin/vehicles' },
      vehicles.filter((v) => !v.main_image).length && { icon: ImageOff, text: `${plural(vehicles.filter((v) => !v.main_image).length, 'car')} without a photo`, to: '/admin/vehicles' },
      vehicles.filter((v) => v.is_demo).length && { icon: Sparkles, text: `${plural(vehicles.filter((v) => v.is_demo).length, 'demo listing')} to replace with real stock`, to: '/admin/vehicles' },
      !hasAnyContact && { icon: Phone, text: 'Add your phone, email and address to the website', hint: 'Set these in .env' },
    ].filter(Boolean);

    const activity = messages.slice(0, 6).map((m) => ({
      id: m.id,
      icon: m.type === 'rental' ? KeyRound : MessageSquare,
      who: m.full_name,
      what: m.type === 'rental' ? 'requested a rental' : 'sent an enquiry',
      about: m.vehicle_interest,
      when: m.created_at,
      to: m.type === 'rental' ? '/admin/rentals' : '/admin/enquiries',
    }));

    return { available, stockValue, fleet, upcoming, booked, week, lastWeek, daily, makes, statuses, newRentals, newEnquiries, attention, activity };
  }, [vehicles, messages]);
}

const rise = (i) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.04, ease: EASE },
});

export default function Dashboard() {
  useDocumentMeta({ title: 'Admin overview', noindex: true });
  const vehicles = useAsync(() => listVehicles(), []);
  const messages = useAsync(() => listAllMessages(), []);
  const o = useOverview(vehicles.data || [], messages.data || []);

  if (vehicles.loading || messages.loading) return <Loading />;
  if (vehicles.error) return <ErrorState error={vehicles.error} onRetry={vehicles.reload} />;
  if (messages.error) return <ErrorState error={messages.error} onRetry={messages.reload} />;

  const toReply = o.newRentals.length + o.newEnquiries.length;
  const weekDelta = o.week - o.lastWeek;
  const kpis = [
    { label: 'Stock for sale', value: formatCompact(o.stockValue), note: `${plural(o.available.filter(isForSale).length, 'car')} available`, icon: CircleDollarSign, to: '/admin/vehicles?status=available' },
    { label: 'Rental fleet', value: o.fleet.length, note: `of ${plural(vehicles.data.length, 'car')} in stock`, icon: KeyRound, to: '/admin/rentals' },
    { label: 'Rentals booked', value: formatCompact(o.booked), note: `${plural(o.upcoming.length, 'upcoming booking')}`, icon: CalendarCheck, to: '/admin/rentals?status=confirmed' },
    { label: 'Messages this week', value: o.week, note: weekDelta === 0 ? 'Same as last week' : `${Math.abs(weekDelta)} ${weekDelta > 0 ? 'more' : 'fewer'} than last week`, icon: MessageSquare, to: '/admin/enquiries' },
  ];

  return (
    <div className="admin-page overview">
      <motion.section className="welcome" {...rise(0)}>
        <div className="welcome__copy">
          <p className="welcome__date">{new Date().toLocaleDateString(site.locale, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>{greeting()}.</h1>
          <p className="welcome__lede">
            {toReply ? <>You have <strong>{toReply === 1 ? '1 customer' : `${toReply} customers`}</strong> waiting for a reply.</> : 'Everything is answered. Nice work.'}
          </p>
          <div className="welcome__actions">
            <Link to="/admin/vehicles/new" className="welcome__btn welcome__btn--solid"><Plus aria-hidden="true" /> Add vehicle</Link>
            {toReply > 0 && <Link to={o.newRentals.length ? '/admin/rentals?status=new' : '/admin/enquiries?status=new'} className="welcome__btn">Reply now <ArrowRight aria-hidden="true" /></Link>}
            <a href="/" target="_blank" rel="noopener noreferrer" className="welcome__btn">View website <ExternalLink aria-hidden="true" /></a>
          </div>
        </div>
        <img className="welcome__car" src="/images/hero-car-860.webp" alt="" width="860" height="432" />
      </motion.section>

      <ul className="kpis">
        {kpis.map(({ label, value, note, icon: Icon, to }, i) => (
          <motion.li key={label} {...rise(i + 1)}>
            <Link to={to} className="kpi">
              <span className="kpi__top"><span className="kpi__icon"><Icon aria-hidden="true" /></span><ArrowUpRight className="kpi__go" aria-hidden="true" /></span>
              <span className="kpi__value">{value}</span>
              <span className="kpi__label">{label}</span>
              <span className="kpi__note">{note}</span>
            </Link>
          </motion.li>
        ))}
      </ul>

      <div className="overview__grid">
        <motion.section className="panel overview__wide" {...rise(5)}>
          <div className="panel__head">
            <div><h2>Customer messages</h2><p className="panel__sub">Enquiries and rental requests, last 14 days</p></div>
          </div>
          <ColumnChart data={o.daily} unit="message" caption="Customer messages per day, last 14 days" />
        </motion.section>

        <motion.section className="panel" {...rise(6)}>
          <div className="panel__head"><h2>Needs attention</h2></div>
          {o.attention.length === 0 ? (
            <p className="panel__empty"><CheckCircle2 aria-hidden="true" /> All clear. Nothing needs you right now.</p>
          ) : (
            <ul className="todo">
              {o.attention.map(({ icon: Icon, text, to, urgent, hint }) => {
                const inner = (
                  <>
                    <span className={`todo__icon${urgent ? ' is-urgent' : ''}`}><Icon aria-hidden="true" /></span>
                    <span className="todo__text">{text}{hint && <small>{hint}</small>}</span>
                    {to && <ArrowRight className="todo__go" aria-hidden="true" />}
                  </>
                );
                return <li key={text}>{to ? <Link to={to} className="todo__row">{inner}</Link> : <div className="todo__row">{inner}</div>}</li>;
              })}
            </ul>
          )}
        </motion.section>

        <motion.section className="panel" {...rise(7)}>
          <div className="panel__head"><div><h2>Stock by make</h2><p className="panel__sub">{plural(vehicles.data.length, 'car')} in total</p></div></div>
          <BarList data={o.makes.slice(0, 6)} caption="Number of cars by make" />
        </motion.section>

        <motion.section className="panel" {...rise(8)}>
          <div className="panel__head"><div><h2>Availability</h2><p className="panel__sub">Current status of your stock</p></div></div>
          <BarList data={o.statuses} caption="Number of cars by availability" />
          <Link to="/admin/vehicles" className="panel__link">Manage vehicles <ArrowRight aria-hidden="true" /></Link>
        </motion.section>

        <motion.section className="panel" {...rise(9)}>
          <div className="panel__head"><h2>Upcoming rentals</h2><Link to="/admin/rentals" className="btn btn--ghost btn--sm">All</Link></div>
          {o.upcoming.length === 0 ? (
            <div className="panel__blank">
              <span className="panel__blank-icon"><CalendarCheck aria-hidden="true" /></span>
              <p>No confirmed bookings yet. Confirmed rentals show here with their dates.</p>
            </div>
          ) : (
            <ul className="agenda">
              {o.upcoming.slice(0, 4).map((r) => {
                const start = new Date(`${r.rent_start}T12:00:00`);
                return (
                  <li key={r.id}>
                    <span className="agenda__date"><strong>{start.getDate()}</strong>{shortDay(start, { month: 'short' })}</span>
                    <span className="agenda__text"><strong>{r.vehicle_interest}</strong><small>{r.full_name} · {plural(rentalDays(r), 'day')}</small></span>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.section>

        <motion.section className="panel overview__wide" {...rise(10)}>
          <div className="panel__head"><h2>Latest activity</h2><Link to="/admin/enquiries" className="btn btn--ghost btn--sm">View all <ArrowRight /></Link></div>
          {o.activity.length === 0 ? (
            <div className="panel__blank">
              <span className="panel__blank-icon"><Inbox aria-hidden="true" /></span>
              <p>Messages from the website will appear here.</p>
            </div>
          ) : (
            <ul className="feed">
              {o.activity.map(({ id, icon: Icon, who, what, about, when, to }) => (
                <li key={id}>
                  <Link to={to} className="feed__row">
                    <span className="feed__icon"><Icon aria-hidden="true" /></span>
                    <span className="feed__text"><strong>{who}</strong> {what}{about ? <> about <strong>{about}</strong></> : ''}</span>
                    <time className="feed__when">{formatDate(when)}</time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.section className="panel overview__showcase" {...rise(11)}>
          <div className="panel__head"><h2>Most valuable stock</h2></div>
          <ul className="topcars">
            {[...o.available].filter(isForSale).sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 3).map((v) => (
              <li key={v.id}>
                <Link to={`/admin/vehicles/${v.id}`} className="topcar">
                  {v.main_image ? <img src={img(v.main_image, 200)} alt="" loading="lazy" /> : <span className="topcar__ph"><CarFront aria-hidden="true" /></span>}
                  <span className="topcar__text"><strong>{v.make} {v.model}</strong><small>{v.year}</small></span>
                  <span className="topcar__price">{formatPrice(v.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>
      <span className="sr-only">{formatNumber(vehicles.data.length)} vehicles in total.</span>
    </div>
  );
}
