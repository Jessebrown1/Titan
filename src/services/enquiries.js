import { isSupabaseConfigured, rest } from '../lib/backend';

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
