import { useEffect, useRef, useState } from 'react';
import { FileCheck2, Upload, X } from 'lucide-react';

const MAX_MB = 10;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// Picks a document to send with a rental request. Nothing uploads until the form is submitted.
export default function DocumentUpload({ id, label, file, onChange, error }) {
  const input = useRef(null);
  const [problem, setProblem] = useState('');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(e) {
    const chosen = e.target.files?.[0];
    e.target.value = '';
    if (!chosen) return;
    if (!TYPES.includes(chosen.type)) {
      setProblem('Please choose a JPG, PNG, WebP or PDF file.');
      return;
    }
    if (chosen.size > MAX_MB * 1024 * 1024) {
      setProblem(`Please choose a file under ${MAX_MB} MB.`);
      return;
    }
    setProblem('');
    onChange(chosen);
  }

  return (
    <div className="field">
      <span className="field__label" id={`${id}-label`}>{label}</span>
      {file ? (
        <div className="docpick docpick--done">
          {preview ? <img src={preview} alt="" /> : <span className="docpick__icon"><FileCheck2 aria-hidden="true" /></span>}
          <span className="docpick__name">{file.name}</span>
          <button type="button" onClick={() => onChange(null)} aria-label={`Remove ${label}`}><X aria-hidden="true" /></button>
        </div>
      ) : (
        <button type="button" className={`docpick${error ? ' is-invalid' : ''}`} aria-labelledby={`${id}-label`} onClick={() => input.current?.click()}>
          <span className="docpick__icon"><Upload aria-hidden="true" /></span>
          <span className="docpick__name">Add a photo or PDF</span>
        </button>
      )}
      <input ref={input} id={id} type="file" accept={TYPES.join(',')} hidden onChange={pick} />
      {(problem || error) && <span className="field__error">{problem || error}</span>}
    </div>
  );
}
