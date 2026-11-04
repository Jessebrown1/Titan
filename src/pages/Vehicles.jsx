import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, SlidersHorizontal, X, CarFront } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import VehicleCard from '../components/VehicleCard';
import { CardSkeletons, EmptyState, ErrorState } from '../components/States';
import { useVehicles } from '../hooks/useVehicles';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { formatPrice, FUEL_TYPES, isForSale, isRentable, TRANSMISSIONS } from '../lib/format';

// Price filter steps scale to the inventory, so they suit any currency.
function priceSteps(prices) {
  if (!prices.length) return [];
  const lo = Math.min(...prices) / 2;
  const hi = Math.max(...prices) * 1.2;
  const steps = [];
  for (let mag = 10 ** Math.floor(Math.log10(lo)); mag <= hi; mag *= 10) {
    for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 7.5]) {
      const v = m * mag;
      if (v >= lo && v <= hi) steps.push(v);
    }
  }
  return steps;
}
const SORTS = {
  newest: { label: 'Newest listed', fn: (a, b) => new Date(b.created_at) - new Date(a.created_at) },
  'price-asc': { label: 'Price: low to high', fn: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity) },
  'price-desc': { label: 'Price: high to low', fn: (a, b) => (b.price ?? -1) - (a.price ?? -1) },
  'year-desc': { label: 'Year: newest first', fn: (a, b) => b.year - a.year },
  'mileage-asc': { label: 'Mileage: lowest first', fn: (a, b) => (a.mileage ?? Infinity) - (b.mileage ?? Infinity) },
};
const STATUS_ORDER = { available: 0, reserved: 1, sold: 2 };
const FILTER_KEYS = ['q', 'make', 'minPrice', 'maxPrice', 'minYear', 'transmission', 'fuel', 'hideSold'];

export default function Vehicles({ rentOnly = false }) {
  useDocumentMeta(
    rentOnly
      ? { title: 'Rent a Car', description: 'Rent a vehicle from TITAN MOTORS by the day. Choose your dates and send a request; our team confirms availability.' }
      : { title: 'Our Vehicles', description: 'Browse the TITAN MOTORS collection. Search and filter by make, price, year, transmission and fuel type.' },
  );
  const { data, loading, error, reload } = useVehicles();
  const [params, setParams] = useSearchParams();
  const [panelOpen, setPanelOpen] = useState(false);

  const get = (k) => params.get(k) || '';
  const set = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };
  const reset = () => {
    const next = new URLSearchParams(params);
    FILTER_KEYS.forEach((k) => next.delete(k));
    setParams(next, { replace: true });
  };

  const listing = rentOnly ? 'rent' : 'sale';
  const all = useMemo(() => (data || []).filter(rentOnly ? isRentable : isForSale), [data, rentOnly]);
  const makes = useMemo(() => [...new Set(all.map((v) => v.make))].sort(), [all]);
  const years = useMemo(() => [...new Set(all.map((v) => v.year))].sort((a, b) => b - a), [all]);
  const priceOf = (v) => (listing === 'rent' ? v.rent_per_day : v.price);
  const PRICE_STEPS = useMemo(() => priceSteps(all.map((v) => Number(priceOf(v))).filter((n) => n > 0)), [all, listing]);

  const results = useMemo(() => {
    const q = get('q').toLowerCase().trim();
    const make = get('make');
    const minPrice = Number(get('minPrice')) || 0;
    const maxPrice = Number(get('maxPrice')) || Infinity;
    const minYear = Number(get('minYear')) || 0;
    const transmission = get('transmission');
    const fuel = get('fuel');
    const hideSold = get('hideSold') === '1';
    const sort = SORTS[get('sort')] || SORTS.newest;
    return all
      .filter((v) => {
        if (q) {
          const hay = `${v.year} ${v.make} ${v.model} ${v.colour || ''} ${v.engine || ''} ${v.fuel_type} ${v.transmission}`.toLowerCase();
          if (!q.split(/\s+/).every((t) => hay.includes(t))) return false;
        }
        if (make && v.make !== make) return false;
        const amount = priceOf(v);
        if (amount != null && (amount < minPrice || amount > maxPrice)) return false;
        if (amount == null && (minPrice > 0 || maxPrice !== Infinity)) return false;
        if (minYear && v.year < minYear) return false;
        if (transmission && v.transmission !== transmission) return false;
        if (fuel && v.fuel_type !== fuel) return false;
        if (hideSold && v.status === 'sold') return false;
        return true;
      })
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || sort.fn(a, b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, params, listing]);

  const activeCount = FILTER_KEYS.filter((k) => k !== 'q' && get(k)).length;

  const filters = (
    <div className="filters__fields">
      <div className="field">
        <label className="field__label" htmlFor="f-make">Manufacturer</label>
        <select id="f-make" className="select" value={get('make')} onChange={(e) => set('make', e.target.value)}>
          <option value="">All manufacturers</option>
          {makes.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="field">
        <span className="field__label" id="f-price">{listing === 'rent' ? 'Daily rate' : 'Price range'}</span>
        <div className="filters__pair" role="group" aria-labelledby="f-price">
          <select aria-label="Minimum price" className="select" value={get('minPrice')} onChange={(e) => set('minPrice', e.target.value)}>
            <option value="">No min</option>
            {PRICE_STEPS.map((p) => <option key={p} value={p}>{formatPrice(p)}</option>)}
          </select>
          <select aria-label="Maximum price" className="select" value={get('maxPrice')} onChange={(e) => set('maxPrice', e.target.value)}>
            <option value="">No max</option>
            {PRICE_STEPS.map((p) => <option key={p} value={p}>{formatPrice(p)}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="f-year">Year</label>
        <select id="f-year" className="select" value={get('minYear')} onChange={(e) => set('minYear', e.target.value)}>
          <option value="">Any year</option>
          {years.map((y) => <option key={y} value={y}>{y} or newer</option>)}
        </select>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="f-trans">Transmission</label>
        <select id="f-trans" className="select" value={get('transmission')} onChange={(e) => set('transmission', e.target.value)}>
          <option value="">Any</option>
          {TRANSMISSIONS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="f-fuel">Fuel type</label>
        <select id="f-fuel" className="select" value={get('fuel')} onChange={(e) => set('fuel', e.target.value)}>
          <option value="">Any</option>
          {FUEL_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      {!rentOnly && (
        <label className="checkbox">
          <input type="checkbox" checked={get('hideSold') === '1'} onChange={(e) => set('hideSold', e.target.checked ? '1' : '')} />
          Hide sold vehicles
        </label>
      )}
      {activeCount > 0 && (
        <button type="button" className="btn btn--ghost btn--sm filters__reset" onClick={reset}>
          <X aria-hidden="true" /> Clear filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {rentOnly ? (
        <PageHeader eyebrow="Rent a car" title="Drive it for a day, a week or a month." word="RENT">
          Choose a vehicle and your dates, with or without a driver. Our team confirms availability before anything is booked.
        </PageHeader>
      ) : (
        <PageHeader eyebrow="Inventory" title="Our Vehicles" word="COLLECTION">
          Explore our selection of vehicles for sale. Looking to hire instead? See our rental cars.
        </PageHeader>
      )}

      <section className="inventory" aria-label="Vehicle inventory">
        <div className="container">
          <div className="toolbar glass">
            <div className="toolbar__search">
              <Search aria-hidden="true" />
              <label htmlFor="f-q" className="sr-only">Search vehicles</label>
              <input
                id="f-q"
                type="search"
                placeholder="Search make, model, colour…"
                value={get('q')}
                onChange={(e) => set('q', e.target.value)}
              />
            </div>
            <div className="toolbar__right">
              <label htmlFor="f-sort" className="sr-only">Sort by</label>
              <select id="f-sort" className="select toolbar__sort" value={get('sort') || 'newest'} onChange={(e) => set('sort', e.target.value === 'newest' ? '' : e.target.value)}>
                {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
              <button
                type="button"
                className="btn btn--outline toolbar__filter-btn"
                aria-expanded={panelOpen}
                aria-controls="filters-panel"
                onClick={() => setPanelOpen((o) => !o)}
              >
                <SlidersHorizontal aria-hidden="true" /> Filters{activeCount ? ` (${activeCount})` : ''}
              </button>
            </div>
          </div>

          <div className="inventory__layout">
            <aside className="filters" aria-label="Filters">
              <h2 className="filters__title">Refine</h2>
              {filters}
            </aside>

            <AnimatePresence>
              {panelOpen && (
                <motion.div
                  id="filters-panel"
                  className="filters-sheet"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="filters-sheet__inner">
                    {filters}
                    <button type="button" className="btn btn--dark btn--block" onClick={() => setPanelOpen(false)}>
                      Show {results.length} {results.length === 1 ? 'vehicle' : 'vehicles'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="inventory__results">
              <p className="inventory__count" aria-live="polite">
                {loading ? 'Loading vehicles…' : `${results.length} ${results.length === 1 ? 'vehicle' : 'vehicles'}`}
              </p>
              {error ? (
                <ErrorState error={error} onRetry={reload} />
              ) : loading ? (
                <div className="vgrid vgrid--two"><CardSkeletons count={4} /></div>
              ) : all.length === 0 ? (
                <EmptyState icon={CarFront} title={listing === 'rent' ? 'No vehicles available to rent yet' : 'No vehicles listed yet'}>
                  New arrivals are on their way. Please contact us to discuss what you are looking for.
                </EmptyState>
              ) : results.length === 0 ? (
                <EmptyState
                  title="No vehicles match your search"
                  action={<button type="button" className="btn btn--outline btn--sm" onClick={reset}>Clear filters</button>}
                >
                  Try adjusting or clearing your filters.
                </EmptyState>
              ) : (
                <div className="vgrid vgrid--two">
                  {results.map((v, i) => <VehicleCard key={v.id} vehicle={v} index={i} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
