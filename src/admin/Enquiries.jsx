import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, Phone, MessageCircle, Trash2, Inbox } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { listEnquiries, updateEnquiryStatus, deleteEnquiry, ENQUIRY_STATUSES } from '../services/enquiriesAdmin';
import { listVehicles } from '../services/vehiclesAdmin';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { img } from '../lib/image';
import { formatDate } from '../lib/format';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const LABEL = { new: 'New', contacted: 'Contacted', resolved: 'Resolved' };

// Matches by ID, or by name for enquiries where the visitor typed the car.
const photoFor = (e, vehicles) => (vehicles || []).find(
  (v) => v.id === e.vehicle_id || `${v.year} ${v.make} ${v.model}` === e.vehicle_interest,
)?.main_image;

export default function Enquiries() {
  useDocumentMeta({ title: 'Enquiries', noindex: true });
  const { data, loading, error, reload, setData } = useAsync(() => listEnquiries(), []);
  const { data: vehicles } = useAsync(() => listVehicles(), []);

  useEffect(() => {
    window.addEventListener('titan:new-message', reload);
    return () => window.removeEventListener('titan:new-message', reload);
  }, [reload]);
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState('');
  const filter = params.get('status') || '';

  const rows = useMemo(() => (data || []).filter((e) => !filter || e.status === filter), [data, filter]);
  const counts = useMemo(
    () => Object.fromEntries(ENQUIRY_STATUSES.map((s) => [s, (data || []).filter((e) => e.status === s).length])),
    [data],
  );

  async function setStatus(e, status) {
    setBusy(e.id);
    setActionError('');
    try {
      await updateEnquiryStatus(e.id, status);
      setData(data.map((x) => (x.id === e.id ? { ...x, status } : x)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(e) {
    if (!window.confirm(`Delete the enquiry from ${e.full_name}? This cannot be undone.`)) return;
    setBusy(e.id);
    try {
      await deleteEnquiry(e.id);
      setData(data.filter((x) => x.id !== e.id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const tab = (value, label, count) => (
    <button
      type="button"
      role="tab"
      aria-selected={filter === value}
      className={`tab${filter === value ? ' is-active' : ''}`}
      onClick={() => {
        const next = new URLSearchParams(params);
        if (value) next.set('status', value);
        else next.delete('status');
        setParams(next, { replace: true });
      }}
    >
      {label} {count != null && <span>{count}</span>}
    </button>
  );

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <h1>Enquiries</h1>
          <p className="muted">Messages submitted through the website contact form.</p>
        </div>
      </header>

      <div className="tabs" role="tablist" aria-label="Filter by status">
        {tab('', 'All', data?.length)}
        {ENQUIRY_STATUSES.map((s) => tab(s, LABEL[s], counts[s]))}
      </div>

      {actionError && <p className="notice notice--error" role="alert">{actionError}</p>}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Inbox} title={data.length ? 'No enquiries with this status' : 'No enquiries yet'} />
      ) : (
        <ul className="enquiries">
          {rows.map((e) => {
            const wa = e.phone ? `https://wa.me/${e.phone.replace(/[^\d]/g, '')}` : null;
            return (
              <li key={e.id} className="enquiry panel" aria-busy={busy === e.id}>
                <div className="enquiry__head">
                  <div>
                    <h2 className="enquiry__name">{e.full_name}</h2>
                    <p className="muted enquiry__date">{formatDate(e.created_at)}</p>
                  </div>
                  <div className="enquiry__status">
                    <span className={`badge badge--${e.status}`}>{LABEL[e.status]}</span>
                    <label className="sr-only" htmlFor={`es-${e.id}`}>Status</label>
                    <select id={`es-${e.id}`} className="select select--sm" value={e.status} disabled={busy === e.id} onChange={(ev) => setStatus(e, ev.target.value)}>
                      {ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>Mark as {LABEL[s].toLowerCase()}</option>)}
                    </select>
                  </div>
                </div>
                {e.vehicle_interest && (
                  <div className="enquiry__car">
                    {photoFor(e, vehicles) && <img src={img(photoFor(e, vehicles), 240)} alt="" loading="lazy" />}
                    <p className="enquiry__vehicle"><span>Vehicle of interest</span>{e.vehicle_interest}</p>
                  </div>
                )}
                <p className="enquiry__msg">{e.message}</p>
                <div className="enquiry__foot">
                  <a className="btn btn--outline btn--sm" href={`mailto:${e.email}?subject=${encodeURIComponent('Your enquiry with TITAN MOTORS')}`}><Mail /> {e.email}</a>
                  {e.phone && <a className="btn btn--outline btn--sm" href={`tel:${e.phone.replace(/\s+/g, '')}`}><Phone /> {e.phone}</a>}
                  {wa && <a className="btn btn--outline btn--sm" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp</a>}
                  <button type="button" className="icon-btn icon-btn--danger enquiry__delete" onClick={() => remove(e)} aria-label={`Delete enquiry from ${e.full_name}`}><Trash2 /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
