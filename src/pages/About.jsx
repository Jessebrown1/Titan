import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import About from '../components/sections/About';
import WhyChoose from '../components/sections/WhyChoose';
import Reveal from '../components/Reveal';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function AboutPage() {
  useDocumentMeta({
    title: 'About Us',
    description: 'TITAN MOTORS helps customers discover exceptional vehicles that match their lifestyle, expectations and ambitions.',
  });
  return (
    <>
      <PageHeader eyebrow="About us" title="Driven by excellence." word="TITAN">
        A considered approach to finding your next vehicle, built on quality, confidence and service.
      </PageHeader>
      <About />
      <WhyChoose />
      <section className="section cta-band">
        <div className="container cta-band__inner">
          <Reveal>
            <h2 className="display-lg">Ready to find your next drive?</h2>
          </Reveal>
          <Reveal delay={0.1} className="cta-band__actions">
            <Link to="/vehicles" className="btn btn--accent btn--lg">Explore collection</Link>
            <Link to="/contact" className="btn btn--glass btn--lg">Contact us <ArrowRight /></Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
