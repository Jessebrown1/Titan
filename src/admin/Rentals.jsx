import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CalendarDays, Check, KeyRound, Mail, MessageCircle, Phone, Trash2, UserRound, X } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { deleteEnquiry, listRentals, rentalDays, updateEnquiryStatus } from '../services/enquiriesAdmin';
import { listVehicles } from '../services/vehiclesAdmin';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { formatDate, formatPrice } from '../lib/format';
import { site } from '../config/site';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const LABEL = { new: 'New', confirmed: 'Confirmed', resolved: 'Completed', declined: 'Declined' };
const TABS = ['new', 'confirmed', 'resolved', 'declined'];
const day = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(site.locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export default function Rentals() {
  useDocumentMeta({ title: 'Rentals', noindex: true });
  const { data, loading, error, reload } = useAsync(async () => {
    const [rentals, vehicles] = await Promise.all([listRentals(), listVehicles()]);
    return { rentals, vehicles };
  }, []);
  const [local, setLocal] = useState(null);
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState('');
  const filter = params.get('status') || '';

  const rentals = local || data?.rentals || [];
  const rateOf = useMemo(() => Object.fromEntries((data?.vehicles || []).map((v) => [v.id, Number(v.rent_per_day) || 0])), [data]);
  const rows = rentals.filter((r) => !filter || r.status === filter);

  const clashWith = (r) => rentals.find((o) => o.id !== r.id && o.status === 'confirmed' && o.vehicle_id === r.vehicle_id
    && r.rent_start <= o.rent_end && r.rent_end >= o.rent_start);

  async function setStatus(r, status) {
    setBusy(r.id);
    setActionError('');
    try {
      await updateEnquiryStatus(r.id, status);
      setLocal(rentals.map((x) => (x.id === r.id ? { ...x, status } : x)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(r) {
    if (!window.confirm(`Delete the rental request from ${r.full_name}? This cannot be undone.`)) return;
    setBusy(r.id);
    try {
      await deleteEnquiry(r.id);
      setLocal(rentals.filter((x) => x.id !== r.id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const tab = (value, label, count) => (
    <button
      key={label}
      type="button"
      aria-pressed={filter === value}
      className={`tab${filter === value ? ' is-active' : ''}`}
      onClick={() => {
        const next = new URLSearchParams(params);
        if (value) next.set('status', value);
        else next.delete('status');
        setParams(next, { replace: true });
      }}
    >
      {label} <span>{count}</span>
    </button>
  );

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <h1>Rentals</h1>
          <p className="muted">Booking requests from the website. Confirming a request blocks those dates for that car.</p>
        </div>
      </header>

      <div className="tabs" role="group" aria-label="Filter by status">
        {tab('', 'All', rentals.length)}
        {TABS.map((s) => tab(s, LABEL[s], rentals.filter((r) => r.status === s).length))}
      </div>

      {actionError && <p className="notice notice--error" role="alert">{actionError}</p>}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title={rentals.length ? 'No rentals with this status' : 'No rental requests yet'}
          action={!rentals.length && <Link to="/admin/vehicles" className="btn btn--outline btn--sm">Set rental rates</Link>}
        >
          {!rentals.length && 'Requests from the Rent a Car page will appear here.'}
        </EmptyState>
      ) : (
        <ul className="enquiries">
          {rows.map((r) => {
            const days = rentalDays(r);
            const rate = rateOf[r.vehicle_id] || 0;
            const clash = r.status !== 'confirmed' && r.status !== 'declined' && clashWith(r);
            const wa = r.phone ? `https://wa.me/${r.phone.replace(/[^\d]/g, '').replace(/^0(\d{9})$/, '233$1')}` : null;
            return (
              <li key={r.id} className="enquiry panel" aria-busy={busy === r.id}>
                <div className="enquiry__head">
                  <div>
                    <h2 className="enquiry__name">{r.vehicle_interest || 'Vehicle removed'}</h2>
                    <p className="muted enquiry__date">{r.full_name} · received {formatDate(r.created_at)}</p>
                  </div>
                  <span className={`badge badge--${r.status}`}>{LABEL[r.status] || r.status}</span>
                </div>

                <dl className="rentfacts">
                  <div><dt><CalendarDays aria-hidden="true" /> Pick-up</dt><dd>{day(r.rent_start)}</dd></div>
                  <div><dt><CalendarDays aria-hidden="true" /> Return</dt><dd>{day(r.rent_end)}</dd></div>
                  <div><dt><UserRound aria-hidden="true" /> Driver</dt><dd>{r.with_driver ? 'Requested' : 'Self-drive'}</dd></div>
                  <div><dt>Estimate</dt><dd>{rate ? `${formatPrice(days * rate)} (${days} ${days === 1 ? 'day' : 'days'})` : `${days} ${days === 1 ? 'day' : 'days'}`}</dd></div>
                </dl>

                {clash && (
                  <p className="notice notice--warning">
                    <AlertTriangle aria-hidden="true" />
                    <span>Clashes with {clash.full_name}&rsquo;s confirmed booking ({clash.rent_start} to {clash.rent_end}).</span>
                  </p>
                )}

                <div className="enquiry__foot">
                  {r.status === 'new' && (
                    <>
                      <button type="button" className="btn btn--dark btn--sm" disabled={busy === r.id || Boolean(clash)} onClick={() => setStatus(r, 'confirmed')}><Check /> Confirm</button>
                      <button type="button" className="btn btn--outline btn--sm" disabled={busy === r.id} onClick={() => setStatus(r, 'declined')}><X /> Decline</button>
                    </>
                  )}
                  {r.status === 'confirmed' && (
                    <button type="button" className="btn btn--outline btn--sm" disabled={busy === r.id} onClick={() => setStatus(r, 'resolved')}><Check /> Mark completed</button>
                  )}
                  {wa && <a className="btn btn--outline btn--sm" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp</a>}
                  {r.phone && <a className="btn btn--outline btn--sm" href={`tel:${r.phone.replace(/\s+/g, '')}`}><Phone /> Call</a>}
                  <a className="btn btn--outline btn--sm" href={`mailto:${r.email}?subject=${encodeURIComponent(`Your TITAN MOTORS rental: ${r.vehicle_interest || ''}`)}`}><Mail /> Email</a>
                  <button type="button" className="icon-btn icon-btn--danger enquiry__delete" onClick={() => remove(r)} aria-label={`Delete rental request from ${r.full_name}`}><Trash2 /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
