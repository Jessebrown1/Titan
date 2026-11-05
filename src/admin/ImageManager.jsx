import { useRef, useState } from 'react';
import { ImagePlus, Trash2, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { uploadVehicleImage } from '../services/vehiclesAdmin';
import { img } from '../lib/image';

const MAX_MB = 15;

// Ordered list of image URLs; the first one is the main photograph.
export default function ImageManager({ images, onChange, onUploaded, invalid }) {
  const input = useRef(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);

  async function handleFiles(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'));
    const tooBig = files.filter((f) => f.size > MAX_MB * 1024 * 1024);
    const ok = files.filter((f) => f.size <= MAX_MB * 1024 * 1024);
    setError(tooBig.length ? `${tooBig.length} file(s) skipped. Images must be under ${MAX_MB} MB.` : '');
    if (!ok.length) return;
    setUploading((n) => n + ok.length);
    const urls = [];
    for (const file of ok) {
      try {
        const url = await uploadVehicleImage(file);
        urls.push(url);
        onUploaded?.(url);
      } catch (err) {
        console.error(err);
        setError(`Upload failed for ${file.name}: ${err.message}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (urls.length) onChange((prev) => [...prev, ...urls]);
  }

  const move = (i, d) =>
    onChange((prev) => {
      const next = [...prev];
      const j = i + d;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const makeMain = (i) => onChange((prev) => [prev[i], ...prev.filter((_, k) => k !== i)]);
  const remove = (i) => onChange((prev) => prev.filter((_, k) => k !== i));

  return (
    <div className="images">
      <ul className="images__grid">
        {images.map((url, i) => (
          <li key={url} className={`images__item${i === 0 ? ' is-main' : ''}`}>
            <img src={img(url, 400)} alt={i === 0 ? 'Main photograph' : `Photograph ${i + 1}`} />
            {i === 0 && <span className="images__main-tag">Main</span>}
            <div className="images__tools">
              {i !== 0 && (
                <button type="button" onClick={() => makeMain(i)} aria-label="Set as main photograph" title="Set as main"><Star /></button>
              )}
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier"><ChevronLeft /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Move later"><ChevronRight /></button>
              <button type="button" onClick={() => remove(i)} aria-label="Remove photograph" className="danger"><Trash2 /></button>
            </div>
          </li>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <li key={`up-${i}`} className="images__item images__item--loading"><div className="spinner" /></li>
        ))}
        <li>
          <button
            type="button"
            className={`images__drop${drag ? ' is-drag' : ''}${invalid ? ' is-invalid' : ''}`}
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
          >
            <ImagePlus aria-hidden="true" />
            <span>Add photographs</span>
            <small>Click or drop images</small>
          </button>
        </li>
      </ul>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
      <p className="field__hint">The first photograph is the main image. Large photos are resized automatically before upload.</p>
      {error && <p className="field__error" role="alert">{error}</p>}
    </div>
  );
}
