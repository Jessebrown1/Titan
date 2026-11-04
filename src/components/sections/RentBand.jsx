import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, CarFront, PhoneCall } from 'lucide-react';
import Reveal from '../Reveal';
import SplitText from '../motion/SplitText';
import { formatRate, isRentable } from '../../lib/format';
import { img } from '../../lib/image';

const STEPS = [
  { icon: CarFront, title: 'Choose a car', text: 'Pick from the vehicles available to rent.' },
  { icon: CalendarDays, title: 'Pick your dates', text: 'See your estimate, with or without a driver.' },
  { icon: PhoneCall, title: 'We confirm', text: 'Our team contacts you to finalise everything.' },
];

// Homepage invitation to rent; hidden until at least one car is rentable.
export default function RentBand({ vehicles }) {
  const rentals = (vehicles || []).filter(isRentable).sort((a, b) => a.rent_per_day - b.rent_per_day);
  if (!rentals.length) return null;
  const shown = [rentals[0], rentals[Math.floor(rentals.length / 2)], rentals[rentals.length - 1]]
    .filter((v, i, all) => all.indexOf(v) === i);

  return (
    <section className="rentband" aria-labelledby="rent-title">
      <div className="container rentband__grid">
        <div className="rentband__copy">
          <Reveal><span className="eyebrow">Rent a car</span></Reveal>
          <SplitText as="h2" id="rent-title" className="display-lg" text={'Not buying today?\nRent it instead.'} />
          <Reveal delay={0.08}>
            <p className="lead">Weddings, business trips, visitors in town or a week upcountry. Rent by the day, with or without a driver.</p>
          </Reveal>
          <ol className="rentband__steps">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={i * 0.05}>
                <span className="rentband__icon"><Icon aria-hidden="true" /></span>
                <div><strong>{title}</strong><p>{text}</p></div>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={0.1}>
            <Link to="/rent" className="btn btn--accent btn--lg btn--shine">See rental cars <ArrowRight aria-hidden="true" /></Link>
          </Reveal>
        </div>

        <ul className="rentband__cars">
          {shown.map((v, i) => (
            <Reveal as="li" key={v.id} delay={i * 0.06}>
              <Link to={`/vehicles/${v.id}`} className="rentcar">
                <img src={img(v.main_image, 520)} alt={`${v.year} ${v.make} ${v.model}`} loading="lazy" decoding="async" />
                <span className="rentcar__text">
                  <span className="rentcar__name">{v.make} {v.model}</span>
                  <span className="rentcar__rate">{formatRate(v.rent_per_day)}</span>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
