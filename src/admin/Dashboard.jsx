import { Link } from 'react-router-dom';
import { CarFront, CheckCircle2, Tag, Star, Inbox, ArrowRight } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { listVehicles } from '../services/vehicles';
import { listEnquiries } from '../services/enquiries';
import { Loading, ErrorState } from '../components/States';
import { formatDate } from '../lib/format';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function Dashboard() {
  useDocumentMeta({ title: 'Admin overview', noindex: true });
  const vehicles = useAsync(() => listVehicles(), []);
  const enquiries = useAsync(() => listEnquiries(), []);

  if (vehicles.loading || enquiries.loading) return <Loading />;
  if (vehicles.error) return <ErrorState error={vehicles.error} onRetry={vehicles.reload} />;
  if (enquiries.error) return <ErrorState error={enquiries.error} onRetry={enquiries.reload} />;

  const v = vehicles.data;
  const e = enquiries.data;
  const stats = [
    { label: 'Total vehicles', value: v.length, icon: CarFront, to: '/admin/vehicles' },
    { label: 'Available', value: v.filter((x) => x.status === 'available').length, icon: CheckCircle2, to: '/admin/vehicles?status=available' },
    { label: 'Sold', value: v.filter((x) => x.status === 'sold').length, icon: Tag, to: '/admin/vehicles?status=sold' },
    { label: 'Featured', value: v.filter((x) => x.featured).length, icon: Star, to: '/admin/vehicles?featured=1' },
    { label: 'New enquiries', value: e.filter((x) => x.status === 'new').length, icon: Inbox, to: '/admin/enquiries?status=new' },
  ];
  const recent = e.slice(0, 6);

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <h1>Overview</h1>
          <p className="muted">Inventory and enquiries at a glance.</p>
        </div>
        <Link to="/admin/vehicles/new" className="btn btn--dark">Add vehicle</Link>
      </header>

      <ul className="stat-grid">
        {stats.map(({ label, value, icon: Icon, to }) => (
          <li key={label}>
            <Link to={to} className="stat">
              <Icon aria-hidden="true" />
              <span className="stat__value">{value}</span>
              <span className="stat__label">{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="panel">
        <div className="panel__head">
          <h2>Recent enquiries</h2>
          <Link to="/admin/enquiries" className="btn btn--ghost btn--sm">View all <ArrowRight /></Link>
        </div>
        {recent.length === 0 ? (
          <p className="panel__empty">No enquiries yet. Messages sent through the website contact form will appear here.</p>
        ) : (
          <div className="table-wrap">
            <table className="table table--stack">
              <thead>
                <tr><th>Customer</th><th>Vehicle of interest</th><th>Received</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recent.map((q) => (
                  <tr key={q.id}>
                    <td className="td--main"><strong>{q.full_name}</strong><br /><span className="muted">{q.email}</span></td>
                    <td data-label="Vehicle">{q.vehicle_interest || <span className="muted">—</span>}</td>
                    <td data-label="Received">{formatDate(q.created_at)}</td>
                    <td data-label="Status"><span className={`badge badge--${q.status}`}>{q.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
