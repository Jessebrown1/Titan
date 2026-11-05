import { supabase } from './supabase';
import { SUPABASE_URL } from './backend';
import { isIOS, isStandalone } from './pwa';

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/notify-admins`;
const OFF_KEY = 'titan-push-off';

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// unsupported | install-first | denied | on | off
export function pushState() {
  if (isIOS() && !isStandalone()) return 'install-first';
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'granted' && !localStorage.getItem(OFF_KEY)) return 'on';
  return 'off';
}

const keyBytes = (base64) => {
  const raw = atob((base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

async function workerReady() {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Notifications need the live website or installed app.')), 6000);
  });
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications were not allowed on this device.');
  const worker = await workerReady();
  const { publicKey } = await fetch(FUNCTION_URL).then((r) => r.json()).catch(() => ({}));
  if (!publicKey) throw new Error('Push notifications aren\u2019t switched on at the server yet.');
  const subscription = await worker.pushManager.getSubscription()
    || await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
  const { error } = await supabase.from('admin_push_subscriptions')
    .upsert({ endpoint: subscription.endpoint, subscription: subscription.toJSON() }, { onConflict: 'endpoint' });
  if (error) throw error;
  localStorage.removeItem(OFF_KEY);
}

export async function disablePush() {
  const worker = await workerReady();
  const subscription = await worker.pushManager.getSubscription();
  if (subscription) {
    await supabase.from('admin_push_subscriptions').delete().eq('endpoint', subscription.endpoint);
    await subscription.unsubscribe();
  }
  localStorage.setItem(OFF_KEY, '1');
}

export async function sendTestPush() {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}` },
    body: JSON.stringify({ test: true }),
  });
  const result = await res.json();
  if (!res.ok || !result.sent) throw new Error(result.error || 'No devices received it. Try turning notifications off and on.');
  return result;
}
