// The loading screen lives in index.html so it shows before any JavaScript runs.
// Once the app is ready it drives away, and the hero starts its entrance.
const MIN_VISIBLE_MS = 1100;
const listeners = new Set();
let done = !document.getElementById('splash');

export const isSplashDone = () => done;

export function onSplashDone(cb) {
  if (done) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function hideSplash() {
  const el = document.getElementById('splash');
  if (!el) return;
  try { sessionStorage.setItem('titan-splash', '1'); } catch { /* storage blocked */ }
  setTimeout(() => {
    el.classList.add('is-leaving');
    setTimeout(() => {
      done = true;
      listeners.forEach((cb) => cb());
      listeners.clear();
    }, 380);
    setTimeout(() => el.remove(), 900);
  }, Math.max(0, MIN_VISIBLE_MS - performance.now()));
}
