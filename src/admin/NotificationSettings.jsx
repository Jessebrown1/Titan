import { useState } from 'react';
import { Bell, BellOff, Send } from 'lucide-react';
import { disablePush, enablePush, pushState, sendTestPush } from '../lib/push';

const COPY = {
  on: ['Notifications are on', 'This device gets an alert for every new enquiry and booking, even when the app is closed.'],
  off: ['Turn on notifications', 'Get an alert on this device for every new enquiry and booking, even when the app is closed.'],
  denied: ['Notifications are blocked', 'Allow notifications for this site in your device or browser settings, then come back.'],
  'install-first': ['Install the app first', 'On iPhone and iPad, notifications only work once the app is on your home screen.'],
  unsupported: ['Not available here', 'This browser doesn’t support notifications. Try Chrome, Safari or Edge.'],
};

export default function NotificationSettings() {
  const [state, setState] = useState(pushState);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  async function run(work, done) {
    setBusy(true);
    setMessage(null);
    try {
      await work();
      setState(pushState());
      if (done) setMessage({ ok: true, text: done });
    } catch (err) {
      setState(pushState());
      setMessage({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const [title, text] = COPY[state];
  return (
    <section className="panel">
      <h2 className="panel__title">Live notifications</h2>
      <div className="notify">
        <span className="kpi__icon">{state === 'on' ? <Bell aria-hidden="true" /> : <BellOff aria-hidden="true" />}</span>
        <div className="notify__text"><strong>{title}</strong><span>{text}</span></div>
        <div className="notify__actions">
          {state === 'off' && <button type="button" className="btn btn--dark btn--sm" disabled={busy} onClick={() => run(enablePush, 'Notifications are on for this device.')}><Bell /> Turn on</button>}
          {state === 'on' && (
            <>
              <button type="button" className="btn btn--dark btn--sm" disabled={busy} onClick={() => run(sendTestPush, 'Test sent. It should arrive in a few seconds.')}><Send /> Send a test</button>
              <button type="button" className="btn btn--outline btn--sm" disabled={busy} onClick={() => run(disablePush)}>Turn off</button>
            </>
          )}
        </div>
      </div>
      {message && <p className={`notice ${message.ok ? 'notice--success' : 'notice--error'}`} style={{ marginTop: 12 }} role="status">{message.text}</p>}
      <p className="notify__live"><i aria-hidden="true" /> While the admin is open, new messages also appear instantly with a sound.</p>
    </section>
  );
}
