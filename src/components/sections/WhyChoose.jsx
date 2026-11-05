import { ListChecks, BadgeCheck, HeartHandshake, MessagesSquare } from 'lucide-react';
import Reveal from '../Reveal';
import SplitText from '../motion/SplitText';

const BENEFITS = [
  { icon: ListChecks, title: 'Carefully Selected Vehicles', text: 'A focused collection rather than an endless lot. Each vehicle is chosen to meet our standards.' },
  { icon: BadgeCheck, title: 'Quality and Reliability', text: 'We favour well-specified vehicles from respected manufacturers, with full details shared upfront.' },
  { icon: HeartHandshake, title: 'Customer-Focused Service', text: 'We take time to understand what you need and help you find the vehicle that genuinely suits you.' },
  { icon: MessagesSquare, title: 'Direct Assistance', text: 'Speak directly with our team by WhatsApp, telephone or email for quick answers and no call centres.' },
];

export default function WhyChoose() {
  return (
    <section className="section section--grey why" aria-labelledby="why-title">
      <div className="container">
        <div className="section-head">
          <Reveal className="section-head__text">
            <span className="eyebrow">Why TITAN MOTORS</span>
            <SplitText as="h2" id="why-title" className="display-lg" text="Why choose us" />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lead">A simple, transparent and personal way to find your next vehicle.</p>
          </Reveal>
        </div>
        <ul className="why__grid">
          {BENEFITS.map(({ icon: Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={i * 0.07} className="why__card">
              <span className="why__icon"><Icon aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
