import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { img, srcSet } from '../lib/image';
import { lockScroll } from '../hooks/useSmoothScroll';

export default function Gallery({ images, title }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const count = images.length;
  const go = useCallback((d) => setIndex((i) => (i + d + count) % count), [count]);

  useEffect(() => {
    if (!zoom) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setZoom(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    lockScroll(true);
    window.addEventListener('keydown', onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener('keydown', onKey);
    };
  }, [zoom, go]);

  if (!count) return <div className="gallery__main gallery__main--empty">No photographs available</div>;
  const alt = (i) => `${title}, photograph ${i + 1} of ${count}`;

  return (
    <div className="gallery">
      <div
        className="gallery__main"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1);
          if (e.key === 'ArrowLeft') go(-1);
        }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.img
            key={images[index]}
            src={img(images[index], 1600)}
            srcSet={srcSet(images[index], [800, 1200, 1600, 2000])}
            sizes="(max-width: 1000px) 100vw, 62vw"
            alt={alt(index)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          />
        </AnimatePresence>
        {count > 1 && (
          <>
            <button type="button" className="gallery__nav gallery__nav--prev btn--glass" onClick={() => go(-1)} aria-label="Previous photograph">
              <ChevronLeft aria-hidden="true" />
            </button>
            <button type="button" className="gallery__nav gallery__nav--next btn--glass" onClick={() => go(1)} aria-label="Next photograph">
              <ChevronRight aria-hidden="true" />
            </button>
          </>
        )}
        <button type="button" className="gallery__expand btn--glass" onClick={() => setZoom(true)} aria-label="View full screen">
          <Expand aria-hidden="true" />
        </button>
        <span className="gallery__count glass">{index + 1} / {count}</span>
      </div>

      {count > 1 && (
        <ul className="gallery__thumbs" aria-label="Choose photograph">
          {images.map((src, i) => (
            <li key={src + i}>
              <button
                type="button"
                className={`gallery__thumb${i === index ? ' is-active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Show photograph ${i + 1}`}
                aria-current={i === index}
              >
                <img src={img(src, 300)} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {zoom && (
          <motion.div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`${title} photographs`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setZoom(false)}
          >
            <img src={img(images[index], 2200)} alt={alt(index)} />
            <button type="button" className="lightbox__close btn--glass" onClick={() => setZoom(false)} aria-label="Close" autoFocus>
              <X aria-hidden="true" />
            </button>
            {count > 1 && (
              <>
                <button type="button" className="gallery__nav gallery__nav--prev btn--glass" onClick={() => go(-1)} aria-label="Previous photograph"><ChevronLeft /></button>
                <button type="button" className="gallery__nav gallery__nav--next btn--glass" onClick={() => go(1)} aria-label="Next photograph"><ChevronRight /></button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
