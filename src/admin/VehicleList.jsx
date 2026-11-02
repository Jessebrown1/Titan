import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Star, Search, ExternalLink } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { listVehicles, updateVehicle, deleteVehicle } from '../services/vehicles';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { formatMileage, formatPrice, STATUS_LABEL } from '../lib/format';
import { img } from '../lib/image';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function VehicleList() {
  useDocumentMeta({ title: 'Manage vehicles', noindex: true });
  const { data, loading, error, reload, setData } = useAsync(() => listVehicles(), []);
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState('');
  const status = params.get('status') || '';
  const featured = params.get('featured') === '1';

  const rows = useMemo(() => {
    const t = q.toLowerCase();
    return (data || []).filter(
      (v) =>
        (!status || v.status === status) &&
        (!featured || v.featured) &&
        (!t || `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(t)),
    );
  }, [data, q, status, featured]);

  async function patch(v, values) {
    setBusy(v.id);
    setActionError('');
    try {
      const updated = await updateVehicle(v.id, values);
      setData(data.map((x) => (x.id === v.id ? updated : x)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(v) {
    if (!window.confirm(`Delete the ${v.year} ${v.make} ${v.model}? This also removes its uploaded photos and cannot be undone.`)) return;
    setBusy(v.id);
    setActionError('');
    try {
      await deleteVehicle(v);
      setData(data.filter((x) => x.id !== v.id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const setFilter = (k, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(k, val);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <h1>Vehicles</h1>
          <p className="muted">{data ? `${data.length} in inventory` : ' '}</p>
        </div>
        <Link to="/admin/vehicles/new" className="btn btn--dark"><Plus /> Add vehicle</Link>
      </header>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search aria-hidden="true" />
          <label htmlFor="av-q" className="sr-only">Search vehicles</label>
          <input id="av-q" className="input" placeholder="Search vehicles" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <label htmlFor="av-status" className="sr-only">Status</label>
        <select id="av-status" className="select" value={status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
        </select>
        <label className="checkbox">
          <input type="checkbox" checked={featured} onChange={(e) => setFilter('featured', e.target.checked ? '1' : '')} /> Featured only
        </label>
      </div>

      {actionError && <p className="notice notice--error" role="alert">{actionError}</p>}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={data.length ? 'No vehicles match' : 'No vehicles yet'}
          action={!data.length && <Link to="/admin/vehicles/new" className="btn btn--dark btn--sm">Add your first vehicle</Link>}
        />
      ) : (
        <div className="table-wrap panel">
          <table className="table table--vehicles table--stack">
            <thead>
              <tr>
                <th>Vehicle</th><th>Price</th><th>Mileage</th><th>Status</th><th>Featured</th><th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} aria-busy={busy === v.id}>
                  <td className="td--main">
                    <div className="vrow">
                      {v.main_image ? <img src={img(v.main_image, 200)} alt="" /> : <span className="vrow__ph" />}
                      <div>
                        <strong>{v.make} {v.model}</strong>
                        <span className="muted">{v.year}{v.is_demo ? ' · Demo' : ''}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Price">{formatPrice(v.price)}</td>
                  <td data-label="Mileage">{formatMileage(v.mileage)}</td>
                  <td data-label="Status" className="td--status">
                    <label className="sr-only" htmlFor={`st-${v.id}`}>Status for {v.make} {v.model}</label>
                    <select
                      id={`st-${v.id}`}
                      className={`select select--sm select--${v.status}`}
                      value={v.status}
                      disabled={busy === v.id}
                      onChange={(e) => patch(v, { status: e.target.value })}
                    >
                      {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </td>
                  <td data-label="Featured" className="td--featured">
                    <button
                      type="button"
                      className={`star${v.featured ? ' is-on' : ''}`}
                      aria-pressed={v.featured}
                      aria-label={v.featured ? 'Remove from homepage' : 'Feature on homepage'}
                      disabled={busy === v.id}
                      onClick={() => patch(v, { featured: !v.featured })}
                    >
                      <Star aria-hidden="true" />
                    </button>
                  </td>
                  <td className="td--actions">
                    <div className="row-actions">
                      <a className="icon-btn" href={`/vehicles/${v.id}`} target="_blank" rel="noopener noreferrer" aria-label="View on website"><ExternalLink /></a>
                      <Link className="icon-btn" to={`/admin/vehicles/${v.id}`} aria-label={`Edit ${v.make} ${v.model}`}><Pencil /></Link>
                      <button type="button" className="icon-btn icon-btn--danger" onClick={() => remove(v)} disabled={busy === v.id} aria-label={`Delete ${v.make} ${v.model}`}><Trash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
