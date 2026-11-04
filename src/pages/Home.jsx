import Hero from '../components/sections/Hero';
import Collection from '../components/sections/Collection';
import Marquee from '../components/sections/Marquee';
import RentBand from '../components/sections/RentBand';
import About from '../components/sections/About';
import WhyChoose from '../components/sections/WhyChoose';
import ContactSection from '../components/sections/ContactSection';
import { useVehicles } from '../hooks/useVehicles';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function Home() {
  useDocumentMeta({});
  const { data: vehicles, loading, error, reload } = useVehicles();
  return (
    <>
      <Hero vehicles={vehicles} />
      <Marquee vehicles={vehicles} />
      <Collection vehicles={vehicles} loading={loading} error={error} onRetry={reload} />
      <RentBand vehicles={vehicles} />
      <About />
      <WhyChoose />
      <ContactSection vehicles={vehicles} />
    </>
  );
}
