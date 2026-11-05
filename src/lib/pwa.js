// Installable admin app. The manifest and service worker are added only inside
// /admin, so the public website stays a normal website.
let installEvent = null;
const listeners = new Set();
const notify = () => listeners.forEach((cb) => cb());

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e;
  notify();
});
window.addEventListener('appinstalled', () => {
  installEvent = null;
  notify();
});

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const canPromptInstall = () => Boolean(installEvent);

export function onInstallChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function promptInstall() {
  if (!installEvent) return false;
  installEvent.prompt();
  const { outcome } = await installEvent.userChoice;
  installEvent = null;
  notify();
  return outcome === 'accepted';
}

export function setupAdminApp() {
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/admin.webmanifest';
    document.head.appendChild(link);
  }
  if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
    const title = document.createElement('meta');
    title.name = 'apple-mobile-web-app-title';
    title.content = 'TITAN Admin';
    document.head.appendChild(title);
  }
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/admin' }).catch(console.error);
  }
}
