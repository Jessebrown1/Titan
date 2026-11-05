import { Phone, Mail, MapPin, MessageCircle, Clock } from 'lucide-react';
import { links, site } from '../config/site';

export default function ContactChannels({ compact = false }) {
  const items = [
    { icon: Phone, label: 'Telephone', value: site.phone, href: links.tel, action: 'Call now' },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: site.whatsapp ? `+${site.whatsapp}` : '',
      href: links.whatsapp(`Hello ${site.name}, I would like some assistance.`),
      action: 'Start a chat',
      external: true,
    },
    { icon: Mail, label: 'Email', value: site.email, href: links.mail(`Enquiry for ${site.name}`), action: 'Send an email' },
    { icon: MapPin, label: 'Location', value: site.address, href: links.map, action: 'Get directions', external: true },
  ];
  return (
    <ul className={`channels${compact ? ' channels--compact' : ''}`}>
      {items.map(({ icon: Icon, label, value, href, action, external }) => {
        const content = (
          <>
            <span className="channels__icon"><Icon aria-hidden="true" /></span>
            <span className="channels__text">
              <span className="channels__label">{label}</span>
              <span className={`channels__value${value ? '' : ' channels__value--pending'}`}>
                {value || 'To be confirmed'}
              </span>
            </span>
            {href && <span className="channels__action">{action}</span>}
          </>
        );
        return (
          <li key={label}>
            {href ? (
              <a className="channels__item" href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {content}
              </a>
            ) : (
              <div className="channels__item channels__item--static">{content}</div>
            )}
          </li>
        );
      })}
      {site.hours && (
        <li>
          <div className="channels__item channels__item--static">
            <span className="channels__icon"><Clock aria-hidden="true" /></span>
            <span className="channels__text">
              <span className="channels__label">Opening hours</span>
              <span className="channels__value">{site.hours}</span>
            </span>
          </div>
        </li>
      )}
    </ul>
  );
}
