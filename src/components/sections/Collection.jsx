import { Link } from 'react-router-dom';
import { ArrowRight, CarFront } from 'lucide-react';
import VehicleCard from '../VehicleCard';
import Reveal from '../Reveal';
import SplitText from '../motion/SplitText';
import { CardSkeletons, EmptyState, ErrorState } from '../States';
import { isForSale } from '../../lib/format';

export default function Collection({ vehicles, loading, error, onRetry }) {
  // Featured first; top up with the newest available vehicles so the row is never sparse.
  const list = (vehicles || []).filter(isForSale);
  const featured = list.filter((v) => v.featured && v.status !== 'sold');
  const rest = list.filter((v) => !featured.includes(v) && v.status === 'available');
  const shown = [...featured, ...rest].slice(0, 6);

  return (
    <section id="collection" className="section collection" aria-labelledby="collection-title">
      <div className="container">
        <div className="section-head">
          <Reveal className="section-head__text">
            <span className="eyebrow">Our collection</span>
            <SplitText as="h2" id="collection-title" className="display-lg" text="Our Collection" />
            <p className="lead">Explore a carefully selected collection of exceptional vehicles.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <Link to="/vehicles" className="btn btn--outline">
              View all vehicles <ArrowRight aria-hidden="true" />
            </Link>
          </Reveal>
        </div>

        {error ? (
          <ErrorState error={error} onRetry={onRetry} />
        ) : loading ? (
          <div className="vgrid"><CardSkeletons count={3} /></div>
        ) : shown.length === 0 ? (
          <EmptyState icon={CarFront} title="New arrivals coming soon">
            Our collection is being updated. Please get in touch to discuss what you are looking for.
          </EmptyState>
        ) : (
          <div className="vgrid">
            {shown.map((v, i) => <VehicleCard key={v.id} vehicle={v} index={i} />)}
          </div>
        )}
      </div>
    </section>
  );
}
