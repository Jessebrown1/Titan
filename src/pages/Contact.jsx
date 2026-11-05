import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ContactSection from '../components/sections/ContactSection';
import { useVehicles } from '../hooks/useVehicles';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function ContactPage() {
  useDocumentMeta({
    title: 'Contact',
    description: 'Contact TITAN MOTORS by WhatsApp, telephone, email or our enquiry form.',
  });
  const [params] = useSearchParams();
  const { data: vehicles } = useVehicles();
  const vehicleId = params.get('vehicle');
  const match = vehicles?.find((v) => v.id === vehicleId);
  const defaultVehicle = match ? `${match.year} ${match.make} ${match.model}` : '';
  return (
    <>
      <PageHeader eyebrow="Contact" title="We're here to help." word="CONTACT">
        Speak with our team about any vehicle in our collection, or tell us what you are looking for.
      </PageHeader>
      <ContactSection
        key={defaultVehicle}
        vehicles={vehicles}
        defaultVehicle={defaultVehicle}
      />
    </>
  );
}
