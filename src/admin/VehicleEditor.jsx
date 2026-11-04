import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import ImageManager from './ImageManager';
import { createVehicle, getVehicle, updateVehicle, removeVehicleImage } from '../services/vehiclesAdmin';
import { Loading, ErrorState } from '../components/States';
import { FUEL_TYPES, TRANSMISSIONS, STATUS_LABEL } from '../lib/format';
import { site } from '../config/site';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const EMPTY = {
  make: '', model: '', year: String(new Date().getFullYear()), price: '', mileage: '',
  transmission: 'Automatic', fuel_type: 'Petrol', engine: '', colour: '', description: '',
  status: 'available', featured: false, for_sale: true, for_rent: false, rent_per_day: '',
};
const MAX_YEAR = new Date().getFullYear() + 1;

function validate(v, images) {
  const e = {};
  if (!v.make.trim()) e.make = 'Make is required.';
  if (!v.model.trim()) e.model = 'Model is required.';
  const y = Number(v.year);
  if (!Number.isInteger(y) || y < 1900 || y > MAX_YEAR) e.year = `Enter a year between 1900 and ${MAX_YEAR}.`;
  if (!v.for_rent && v.price !== '' && (Number.isNaN(Number(v.price)) || Number(v.price) < 0)) e.price = 'Enter a valid price, or leave blank for "Price on request".';
  if (v.mileage !== '' && (!Number.isInteger(Number(v.mileage)) || Number(v.mileage) < 0)) e.mileage = 'Enter a whole number.';
  if (v.for_rent && !(Number(v.rent_per_day) > 0)) e.rent_per_day = 'Enter the daily rental rate.';
  if (!images.length) e.images = 'Add at least one photograph.';
  return e;
}

export default function VehicleEditor() {
  const { id } = useParams();
  const isNew = !id;
  useDocumentMeta({ title: isNew ? 'Add vehicle' : 'Edit vehicle', noindex: true });
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const uploadedThisSession = useRef(new Set());
  const saved = useRef(false);

  useEffect(() => {
    if (isNew) return;
    let active = true;
    getVehicle(id)
      .then((v) => {
        if (!active) return;
        if (!v) throw new Error('Vehicle not found.');
        setOriginal(v);
        setValues({
          ...EMPTY,
          ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, v[k] ?? EMPTY[k]])),
          year: String(v.year ?? ''),
          price: v.price == null ? '' : String(v.price),
          mileage: v.mileage == null ? '' : String(v.mileage),
          rent_per_day: v.rent_per_day == null ? '' : String(v.rent_per_day),
        });
        setImages([v.main_image, ...(v.images || [])].filter(Boolean));
      })
      .catch((err) => active && setLoadError(err))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id, isNew]);

  // Discard photos uploaded during an abandoned edit.
  useEffect(() => () => {
    if (!saved.current) uploadedThisSession.current.forEach((url) => removeVehicleImage(url));
  }, []);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    const errs = validate(values, images);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.querySelector('[aria-invalid="true"], .images__drop.is-invalid')?.focus();
      return;
    }
    setSaving(true);
    setSaveError('');
    const payload = {
      ...values,
      make: values.make.trim(),
      model: values.model.trim(),
      engine: values.engine.trim() || null,
      colour: values.colour.trim() || null,
      description: values.description.trim() || null,
      year: Number(values.year),
      price: values.price === '' ? null : Number(values.price),
      mileage: values.mileage === '' ? null : Number(values.mileage),
      rent_per_day: !values.for_rent || values.rent_per_day === '' ? null : Number(values.rent_per_day),
      for_sale: !values.for_rent,
      main_image: images[0],
      images: images.slice(1),
    };
    try {
      if (isNew) await createVehicle(payload);
      else await updateVehicle(id, payload);
      saved.current = true;
      if (original) {
        const before = [original.main_image, ...(original.images || [])];
        before.filter((u) => u && !images.includes(u)).forEach((u) => removeVehicleImage(u));
      }
      uploadedThisSession.current.forEach((u) => !images.includes(u) && removeVehicleImage(u));
      navigate('/admin/vehicles');
    } catch (err) {
      setSaveError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <Loading />;
  if (loadError) return <ErrorState error={loadError} />;

  const input = (k, label, attrs = {}, required = false) => (
    <div className="field">
      <label className="field__label" htmlFor={`ve-${k}`}>{label}{required && <span className="req">*</span>}</label>
      <input
        id={`ve-${k}`}
        className="input"
        value={values[k]}
        onChange={set(k)}
        aria-invalid={Boolean(errors[k])}
        required={required}
        {...attrs}
      />
      {errors[k] && <span className="field__error">{errors[k]}</span>}
    </div>
  );
  const select = (k, label, options) => (
    <div className="field">
      <label className="field__label" htmlFor={`ve-${k}`}>{label}</label>
      <select id={`ve-${k}`} className="select" value={values[k]} onChange={set(k)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <form className="admin-page" onSubmit={onSubmit} noValidate>
      <header className="admin-page__head">
        <div>
          <Link to="/admin/vehicles" className="detail__back"><ArrowLeft aria-hidden="true" /> Vehicles</Link>
          <h1>{isNew ? 'Add vehicle' : `Edit ${original?.make} ${original?.model}`}</h1>
        </div>
        <button type="submit" className="btn btn--dark" disabled={saving}><Save /> {saving ? 'Saving…' : 'Save vehicle'}</button>
      </header>

      {saveError && <p className="notice notice--error" role="alert">{saveError}</p>}

      <div className="editor">
        <section className="panel editor__main">
          <h2 className="panel__title">Vehicle details</h2>
          <div className="form-grid">
            {input('make', 'Make', { placeholder: 'e.g. Toyota', autoComplete: 'off' }, true)}
            {input('model', 'Model', { placeholder: 'e.g. Land Cruiser Prado', autoComplete: 'off' }, true)}
            {input('year', 'Year', { type: 'number', min: 1900, max: MAX_YEAR, inputMode: 'numeric' }, true)}
            {!values.for_rent && input('price', `Price (${site.currency})`, { type: 'number', min: 0, step: 1, inputMode: 'numeric', placeholder: 'Leave blank for "Price on request"' })}
            {input('mileage', `Mileage (${site.distanceUnit})`, { type: 'number', min: 0, step: 1, inputMode: 'numeric' })}
            {input('colour', 'Colour', { placeholder: 'e.g. Pearl White' })}
            {select('transmission', 'Transmission', TRANSMISSIONS.map((t) => [t, t]))}
            {select('fuel_type', 'Fuel type', FUEL_TYPES.map((t) => [t, t]))}
            <div className="form-grid__full">{input('engine', 'Engine', { placeholder: 'e.g. 2.8L turbo diesel' })}</div>
            <div className="field form-grid__full">
              <label className="field__label" htmlFor="ve-description">Description</label>
              <textarea id="ve-description" className="textarea" rows={6} value={values.description} onChange={set('description')} maxLength={4000} />
            </div>
          </div>
        </section>

        <div className="editor__side">
          <section className="panel">
            <h2 className="panel__title">Publishing</h2>
            {select('status', 'Availability', Object.entries(STATUS_LABEL))}
            <label className="checkbox" style={{ marginTop: 16 }}>
              <input type="checkbox" checked={values.featured} onChange={set('featured')} /> Feature on homepage
            </label>
          </section>
          <section className="panel">
            <h2 className="panel__title">Listing</h2>
            <div className="listing-tabs listing-tabs--block" role="group" aria-label="Listing type">
              {[[false, 'For sale'], [true, 'For rent']].map(([rent, label]) => (
                <button key={label} type="button" aria-pressed={values.for_rent === rent} className={values.for_rent === rent ? 'is-active' : ''} onClick={() => setValues((s) => ({ ...s, for_rent: rent, for_sale: !rent }))}>
                  {label}
                </button>
              ))}
            </div>
            {values.for_rent && input('rent_per_day', `Daily rate (${site.currency})`, { type: 'number', min: 0, step: 1, inputMode: 'numeric' }, true)}
          </section>
          <section className="panel">
            <h2 className="panel__title">Photographs<span className="req">*</span></h2>
            <ImageManager
              images={images}
              onChange={setImages}
              onUploaded={(url) => uploadedThisSession.current.add(url)}
              invalid={Boolean(errors.images)}
            />
            {errors.images && <span className="field__error">{errors.images}</span>}
          </section>
        </div>
      </div>

      {/* Always-reachable save bar on phones */}
      <div className="editor__savebar">
        <Link to="/admin/vehicles" className="btn btn--outline">Cancel</Link>
        <button type="submit" className="btn btn--dark" disabled={saving}><Save /> {saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}
