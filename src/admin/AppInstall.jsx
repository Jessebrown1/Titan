import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Info, Download, EllipsisVertical, Share, SquarePlus, Zap, Smartphone, Wifi } from 'lucide-react';
import { canPromptInstall, isIOS, isStandalone, onInstallChange, promptInstall } from '../lib/pwa';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import NotificationSettings from './NotificationSettings';

const BENEFITS = [
  { icon: Smartphone, title: 'On your home screen', text: 'Opens full screen with its own icon, like any other app.' },
  { icon: Zap, title: 'Opens quickly', text: 'App files are saved on your phone, so it starts fast.' },
  { icon: Wifi, title: 'Always live data', text: 'Vehicles, rentals and enquiries update straight from your database.' },
];

export default function AppInstall() {
  useDocumentMeta({ title: 'Get the app', noindex: true });
  const [, refresh] = useState(0);
  const [installing, setInstalling] = useState(false);
  useEffect(() => onInstallChange(() => refresh((n) => n + 1)), []);

  const standalone = isStandalone();
  const ios = isIOS();
  const secure = window.isSecureContext;
  const online = !['localhost', '127.0.0.1'].includes(window.location.hostname);

  async function install() {
    setInstalling(true);
    await promptInstall();
    setInstalling(false);
  }

  return (
    <div className="admin-page appinstall">
      <section className="appinstall__hero">
        <div className="appinstall__copy">
          <p className="welcome__date">TITAN Admin</p>
          <h1>Your dealership, on your phone.</h1>
          <p className="welcome__lede">Add the admin to your home screen and run it like an app, with live notifications for every new enquiry and booking.</p>
          {standalone ? (
            <p className="appinstall__done"><CheckCircle2 aria-hidden="true" /> You&rsquo;re using the app.</p>
          ) : canPromptInstall() ? (
            <button type="button" className="welcome__btn welcome__btn--solid appinstall__cta" onClick={install} disabled={installing}>
              <Download aria-hidden="true" /> {installing ? 'Installing…' : 'Install the app'}
            </button>
          ) : null}
        </div>
        <div className="appinstall__phone" aria-hidden="true">
          <div className="appinstall__screen">
            <img src="/icons/icon-192.png" alt="" width="72" height="72" />
            <span>TITAN Admin</span>
          </div>
        </div>
      </section>

      <NotificationSettings />

      {!standalone && (
        <section className="panel">
          <h2 className="panel__title">How to install</h2>
          {!online && secure && (
            <p className="notice notice--warning"><Info aria-hidden="true" /> You&rsquo;re on the preview address. Phones can only install the app once the website is live on its own web address. Open your live site&rsquo;s /admin/app page on your phone.</p>
          )}
          <div className="appinstall__guides">
            <div className={`appinstall__guide${ios ? ' is-current' : ''}`}>
              <h3>iPhone and iPad</h3>
              <ol>
                <li><span>1</span> Open this page in <strong>Safari</strong></li>
                <li><span>2</span> Tap <Share aria-label="Share" /> <strong>Share</strong></li>
                <li><span>3</span> Tap <SquarePlus aria-label="Add" /> <strong>Add to Home Screen</strong></li>
                <li><span>4</span> Tap <strong>Add</strong></li>
              </ol>
            </div>
            <div className={`appinstall__guide${!ios ? ' is-current' : ''}`}>
              <h3>Android</h3>
              <ol>
                <li><span>1</span> Open this page in <strong>Chrome</strong></li>
                <li><span>2</span> Tap <EllipsisVertical aria-label="Menu" /> <strong>the menu</strong></li>
                <li><span>3</span> Tap <strong>Add to Home screen</strong> or <strong>Install app</strong></li>
                <li><span>4</span> Tap <strong>Install</strong></li>
              </ol>
            </div>
          </div>
          <p className="field__hint appinstall__note">You&rsquo;ll sign in once inside the app. The TITAN icon then opens straight to your dashboard.</p>
        </section>
      )}

      <ul className="appinstall__benefits">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="panel">
            <span className="kpi__icon"><Icon aria-hidden="true" /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ul>

      <Link to="/admin" className="panel__link">Back to overview <ArrowRight aria-hidden="true" /></Link>
    </div>
  );
}
