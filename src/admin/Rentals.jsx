import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, CalendarDays, Check, Clock, FileText, KeyRound, Mail, MessageCircle, Phone, ShieldCheck, Trash2, UserRound, X,
} from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { deleteEnquiry, deleteRentalDocuments, documentLink, listBookings, rentalDays, updateEnquiryStatus } from '../services/enquiriesAdmin';
import { listVehicles } from '../services/vehiclesAdmin';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { formatDate, formatPrice } from '../lib/format';
import { site } from '../config/site';
import { img } from '../lib/image';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const LABEL = { new: 'New', confirmed: 'Confirmed', resolved: 'Completed', declined: 'Declined' };
const STATUSES = ['new', 'confirmed', 'resolved', 'declined'];
const KINDS = [['rental', 'Rentals'], ['test_drive', 'Test drives']];
const day = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(site.locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const time = (t) => new Date(`2000-01-01T${t}:00`).toLocaleTimeString(site.locale, { hour: 'numeric', minute: '2-digit' });

export default function Rentals() {
  useDocumentMeta({ title: 'Bookings', noindex: true });
  const { data, loading, error, reload } = useAsync(async () => {
    const [bookings, vehicles] = await Promise.all([listBookings(), listVehicles()]);
    return { bookings, vehicles };
  }, []);
  const [local, setLocal] = useState(null);

  useEffect(() => {
    const refresh = () => {
      setLocal(null);
      reload();
    };
    window.addEventListener('titan:new-message', refresh);
    return () => window.removeEventListener('titan:new-message', refresh);
  }, [reload]);
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState('');
  const kind = params.get('kind') === 'test_drive' ? 'test_drive' : 'rental';
  const filter = params.get('status') || '';

  const bookings = local || data?.bookings || [];
  const ofKind = bookings.filter((b) => b.type === kind);
  const rows = ofKind.filter((b) => !filter || b.status === filter);
  const vehicleOf = useMemo(() => Object.fromEntries((data?.vehicles || []).map((v) => [v.id, v])), [data]);

  const clashWith = (b) => bookings.find((o) => o.id !== b.id && o.type === b.type && o.status === 'confirmed' && o.vehicle_id === b.vehicle_id && (
    b.type === 'rental'
      ? b.rent_start <= o.rent_end && b.rent_end >= o.rent_start
      : b.drive_date === o.drive_date && b.drive_time === o.drive_time
  ));

  const setParam = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  async function act(b, work) {
    setBusy(b.id);
    setActionError('');
    try {
      await work();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const setStatus = (b, status) => act(b, async () => {
    await updateEnquiryStatus(b.id, status);
    setLocal(bookings.map((x) => (x.id === b.id ? { ...x, status } : x)));
  });

  const remove = (b) => {
    if (!window.confirm(`Delete this request from ${b.full_name}? Any documents are deleted too. This cannot be undone.`)) return;
    act(b, async () => {
      await deleteRentalDocuments(b);
      await deleteEnquiry(b.id);
      setLocal(bookings.filter((x) => x.id !== b.id));
    });
  };

  const removeDocuments = (b) => {
    if (!window.confirm(`Permanently delete ${b.full_name}'s licence and ID? This cannot be undone.`)) return;
    act(b, async () => {
      await deleteRentalDocuments(b);
      setLocal(bookings.map((x) => (x.id === b.id ? { ...x, licence_path: null, id_path: null } : x)));
    });
  };

  // Open the tab first: browsers block pop-ups opened after waiting for a response.
  async function openDocument(path) {
    const tab = window.open('', '_blank');
    try {
      const url = await documentLink(path);
      if (tab) tab.location = url;
      else window.location.href = url;
    } catch (err) {
      tab?.close();
      setActionError(err.message);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <h1>Bookings</h1>
          <p className="muted">Rental and test drive requests. Confirming one blocks that time for the car on the website.</p>
        </div>
      </header>

      <div className="listing-tabs" role="group" aria-label="Booking type">
        {KINDS.map(([value, label]) => (
          <button key={value} type="button" aria-pressed={kind === value} className={kind === value ? 'is-active' : ''} onClick={() => setParam({ kind: value === 'rental' ? '' : value, status: '' })}>
            {label} ({bookings.filter((b) => b.type === value).length})
          </button>
        ))}
      </div>

      <div className="tabs" role="group" aria-label="Filter by status">
        {[['', 'All', ofKind.length], ...STATUSES.map((s) => [s, LABEL[s], ofKind.filter((b) => b.status === s).length])].map(([value, label, count]) => (
          <button key={label} type="button" aria-pressed={filter === value} className={`tab${filter === value ? ' is-active' : ''}`} onClick={() => setParam({ status: value })}>
            {label} <span>{count}</span>
          </button>
        ))}
      </div>

      {actionError && <p className="notice notice--error" role="alert">{actionError}</p>}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title={ofKind.length ? 'Nothing with this status' : `No ${kind === 'rental' ? 'rental' : 'test drive'} requests yet`}
          action={!ofKind.length && <Link to="/admin/vehicles" className="btn btn--outline btn--sm">Manage vehicles</Link>}
        >
          {!ofKind.length && 'Requests from the website will appear here.'}
        </EmptyState>
      ) : (
        <ul className="enquiries">
          {rows.map((b) => {
            const rental = b.type === 'rental';
            const vehicle = vehicleOf[b.vehicle_id];
            const days = rental ? rentalDays(b) : 0;
            const rate = Number(vehicle?.rent_per_day) || 0;
            const clash = b.status === 'new' && clashWith(b);
            const hasDocs = b.licence_path || b.id_path;
            const wa = b.phone ? `https://wa.me/${b.phone.replace(/[^\d]/g, '')}` : null;
            return (
              <li key={b.id} className="enquiry panel" aria-busy={busy === b.id}>
                <div className="enquiry__head">
                  <div className="enquiry__car">
                    {vehicle?.main_image && <img src={img(vehicle.main_image, 240)} alt="" loading="lazy" />}
                    <div>
                      <h2 className="enquiry__name">{b.vehicle_interest || 'Vehicle removed'}</h2>
                      <p className="muted enquiry__date">{b.full_name} · received {formatDate(b.created_at)}</p>
                    </div>
                  </div>
                  <span className={`badge badge--${b.status}`}>{LABEL[b.status] || b.status}</span>
                </div>

                {rental ? (
                  <dl className="rentfacts">
                    <div><dt><CalendarDays aria-hidden="true" /> Pick-up</dt><dd>{day(b.rent_start)}</dd></div>
                    <div><dt><CalendarDays aria-hidden="true" /> Return</dt><dd>{day(b.rent_end)}</dd></div>
                    <div><dt><UserRound aria-hidden="true" /> Driver</dt><dd>{b.with_driver ? 'Requested' : 'Self-drive'}</dd></div>
                    <div><dt>Estimate</dt><dd>{rate ? `${formatPrice(days * rate)} (${days} ${days === 1 ? 'day' : 'days'})` : `${days} ${days === 1 ? 'day' : 'days'}`}</dd></div>
                  </dl>
                ) : (
                  <dl className="rentfacts rentfacts--two">
                    <div><dt><CalendarDays aria-hidden="true" /> Date</dt><dd>{day(b.drive_date)}</dd></div>
                    <div><dt><Clock aria-hidden="true" /> Time</dt><dd>{time(b.drive_time)}</dd></div>
                  </dl>
                )}

                {clash && (
                  <p className="notice notice--warning">
                    <AlertTriangle aria-hidden="true" />
                    <span>Clashes with {clash.full_name}&rsquo;s confirmed booking for this car.</span>
                  </p>
                )}

                {rental && (
                  <div className="docrow">
                    <span className="docrow__label"><ShieldCheck aria-hidden="true" /> Documents</span>
                    {hasDocs ? (
                      <>
                        {b.licence_path && <button type="button" className="btn btn--outline btn--sm" onClick={() => openDocument(b.licence_path)}><FileText /> Licence</button>}
                        {b.id_path && <button type="button" className="btn btn--outline btn--sm" onClick={() => openDocument(b.id_path)}><FileText /> ID</button>}
                        {(b.status === 'resolved' || b.status === 'declined') && (
                          <button type="button" className="btn btn--danger btn--sm" onClick={() => removeDocuments(b)}><Trash2 /> Delete documents</button>
                        )}
                      </>
                    ) : <span className="muted docrow__none">None on file</span>}
                  </div>
                )}

                <div className="enquiry__foot">
                  {b.status === 'new' && (
                    <>
                      <button type="button" className="btn btn--dark btn--sm" disabled={busy === b.id || Boolean(clash)} onClick={() => setStatus(b, 'confirmed')}><Check /> Confirm</button>
                      <button type="button" className="btn btn--outline btn--sm" disabled={busy === b.id} onClick={() => setStatus(b, 'declined')}><X /> Decline</button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <button type="button" className="btn btn--outline btn--sm" disabled={busy === b.id} onClick={() => setStatus(b, 'resolved')}><Check /> Mark completed</button>
                  )}
                  {wa && <a className="btn btn--outline btn--sm" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp</a>}
                  {b.phone && <a className="btn btn--outline btn--sm" href={`tel:${b.phone.replace(/\s+/g, '')}`}><Phone /> Call</a>}
                  <a className="btn btn--outline btn--sm" href={`mailto:${b.email}?subject=${encodeURIComponent(`Your TITAN MOTORS booking: ${b.vehicle_interest || ''}`)}`}><Mail /> Email</a>
                  <button type="button" className="icon-btn icon-btn--danger enquiry__delete" onClick={() => remove(b)} aria-label={`Delete request from ${b.full_name}`}><Trash2 /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
