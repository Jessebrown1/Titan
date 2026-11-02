import ContactChannels from '../ContactChannels';
import ContactForm from '../ContactForm';
import Reveal from '../Reveal';
import SplitText from '../motion/SplitText';

export default function ContactSection({ vehicles, defaultVehicle, vehicleId, headingLevel = 'h2' }) {
  const H = headingLevel;
  const options = (vehicles || [])
    .filter((v) => v.status !== 'sold')
    .map((v) => `${v.year} ${v.make} ${v.model}`);
  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="container contact__grid">
        <div className="contact__info">
          <Reveal>
            <span className="eyebrow">Contact</span>
          </Reveal>
          <SplitText as={H} id="contact-title" className="display-lg" text={'Let\u2019s find your\nnext drive.'} />
          <Reveal delay={0.1}>
            <p className="lead">Have a question about a vehicle? Our team is ready to assist you.</p>
          </Reveal>
          <Reveal delay={0.15}>
            <ContactChannels />
          </Reveal>
        </div>
        <Reveal delay={0.1} className="contact__form glass-card">
          <h3 className="contact__form-title">Send an enquiry</h3>
          <ContactForm vehicleOptions={options} defaultVehicle={defaultVehicle} vehicleId={vehicleId} />
        </Reveal>
      </div>
    </section>
  );
}
