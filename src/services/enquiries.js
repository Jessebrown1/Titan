import { isSupabaseConfigured, rest, SUPABASE_KEY, SUPABASE_URL } from '../lib/backend';
import { compressImage } from '../lib/image';

const DOCUMENT_BUCKET = 'rental-documents';

export async function submitRentalRequest(values) {
  if (!isSupabaseConfigured) {
    throw new Error('NOT_CONFIGURED');
  }
  await rest('enquiries', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ ...values, type: 'rental' }),
  });
}

// Licences and IDs go to a private bucket: visitors can upload but never read them back.
export async function uploadRentalDocument(file, kind) {
  const upload = file.type.startsWith('image/') ? await compressImage(file) : file;
  const ext = upload.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `rentals/${crypto.randomUUID()}/${kind}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${DOCUMENT_BUCKET}/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': upload.type },
    body: upload,
  });
  if (!res.ok) throw new Error(`Document upload failed (${res.status})`);
  return path;
}

export async function submitTestDrive(values) {
  if (!isSupabaseConfigured) {
    throw new Error('NOT_CONFIGURED');
  }
  await rest('enquiries', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ ...values, type: 'test_drive' }),
  });
}

// Confirmed test drives for a car: times only, no customer details.
export async function getTakenDriveSlots(vehicleId) {
  if (!isSupabaseConfigured || vehicleId.startsWith('demo-')) return [];
  return rest('rpc/vehicle_test_drive_slots', { method: 'POST', body: JSON.stringify({ vehicle: vehicleId }) });
}

// Confirmed bookings for a car: date ranges only, no customer details.
export async function getBookedDates(vehicleId) {
  if (!isSupabaseConfigured || vehicleId.startsWith('demo-')) return [];
  return rest('rpc/vehicle_booked_dates', { method: 'POST', body: JSON.stringify({ vehicle: vehicleId }) });
}

export async function submitEnquiry(values) {
  if (!isSupabaseConfigured) {
    throw new Error('NOT_CONFIGURED');
  }
  // The public role may insert but cannot read enquiries back, so ask for no response body.
  await rest('enquiries', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      full_name: values.full_name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || null,
      vehicle_interest: values.vehicle_interest.trim() || null,
      vehicle_id: values.vehicle_id || null,
      message: values.message.trim(),
    }),
  });
}
