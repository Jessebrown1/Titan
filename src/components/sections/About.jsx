import { Gem, ShieldCheck, Sparkles } from 'lucide-react';
import Reveal from '../Reveal';
import SplitText from '../motion/SplitText';
import ImageReveal from '../motion/ImageReveal';
import { img } from '../../lib/image';

const IMAGES = {
  showroom: 'https://images.unsplash.com/photo-1763165524637-9067debdc80b',
  interior: 'https://images.unsplash.com/photo-1649136378672-b965cb9935d5',
  detail: 'https://images.unsplash.com/photo-1629820408206-e9fc918abf63',
};

const VALUES = [
  { icon: Gem, title: 'Quality Selection', text: 'Every vehicle in our collection is chosen with care, with an emphasis on specification, presentation and character.' },
  { icon: ShieldCheck, title: 'Customer Confidence', text: 'Clear information, honest conversations and no pressure, so you can decide with complete confidence.' },
  { icon: Sparkles, title: 'Exceptional Service', text: 'A personal, attentive approach from your first question to the moment you collect your keys.' },
];

export default function About({ headingLevel = 'h2' }) {
  const H = headingLevel;
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="container">
        <div className="about__intro">
          <Reveal>
            <span className="eyebrow">About TITAN MOTORS</span>
          </Reveal>
          <SplitText as={H} id="about-title" className="display-xl about__title" text={'More than just\na vehicle.'} />
          <Reveal delay={0.1} className="about__lead">
            <p className="lead">
              At TITAN MOTORS, we believe choosing a vehicle should be an exceptional experience. We are committed to
              helping our customers discover vehicles that match their lifestyle, expectations and ambitions.
            </p>
          </Reveal>
        </div>

        <div className="mosaic">
          <ImageReveal className="mosaic__a" src={img(IMAGES.showroom, 1400)} alt="A black sports car presented inside a bright, modern showroom" loading="lazy" />
          <ImageReveal className="mosaic__b" delay={0.12} src={img(IMAGES.interior, 900)} alt="Leather seats inside a luxury car cabin" loading="lazy" />
          <ImageReveal className="mosaic__c" delay={0.24} src={img(IMAGES.detail, 900)} alt="Close-up of a premium steering wheel" loading="lazy" />
        </div>

        <ul className="values">
          {VALUES.map(({ icon: Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={i * 0.08} className="values__item">
              <span className="values__index">0{i + 1}</span>
              <Icon aria-hidden="true" className="values__icon" />
              <h3>{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
