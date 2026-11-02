import { Link } from 'react-router-dom';
import Logo from './Logo';
import SocialIcons from './SocialIcons';
import { NAV_ITEMS } from './Navbar';
import { links, site } from '../config/site';

export default function Footer() {
  const contact = [
    { label: 'Telephone', value: site.phone, href: links.tel },
    { label: 'WhatsApp', value: site.whatsapp ? `+${site.whatsapp}` : '', href: links.whatsapp(`Hello ${site.name}, I have a question.`) },
    { label: 'Email', value: site.email, href: links.mail(`Enquiry — ${site.name}`) },
    { label: 'Location', value: site.address, href: links.map },
  ];
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Logo light />
            <p className="footer__tagline">{site.tagline}</p>
            <SocialIcons />
          </div>
          <nav className="footer__col" aria-label="Footer">
            <h2 className="footer__title">Navigate</h2>
            <ul>
              {NAV_ITEMS.map((i) => (
                <li key={i.to}><Link to={i.to}>{i.label}</Link></li>
              ))}
            </ul>
          </nav>
          <div className="footer__col">
            <h2 className="footer__title">Contact</h2>
            <ul>
              {contact.map((c) => (
                <li key={c.label}>
                  <span className="footer__label">{c.label}</span>
                  {c.value ? (
                    c.href ? <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{c.value}</a> : <span>{c.value}</span>
                  ) : (
                    <span className="footer__pending">To be confirmed</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer__word" aria-hidden="true">TITAN</div>
        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>Vehicle details are provided for guidance. Please contact us to confirm availability and specification.</p>
        </div>
      </div>
    </footer>
  );
}
