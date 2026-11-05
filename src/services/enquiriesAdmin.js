import { supabase } from '../lib/supabase';

export const ENQUIRY_STATUSES = ['new', 'contacted', 'resolved'];
const DOCUMENT_BUCKET = 'rental-documents';

const DAY = 86400000;
export const rentalDays = (r) => Math.max(1, Math.round((new Date(r.rent_end) - new Date(r.rent_start)) / DAY));

// Every message from the website: vehicle enquiries and rental requests.
export async function listAllMessages() {
  const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function listEnquiries() {
  const { data, error } = await supabase.from('enquiries').select('*').eq('type', 'sale').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function listBookings() {
  const { data, error } = await supabase.from('enquiries').select('*').in('type', ['rental', 'test_drive']).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// A link to a private document, valid for two minutes.
export async function documentLink(path) {
  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUrl(path, 120);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteRentalDocuments(request) {
  const paths = [request.licence_path, request.id_path].filter(Boolean);
  if (!paths.length) return;
  const { error } = await supabase.storage.from(DOCUMENT_BUCKET).remove(paths);
  if (error) throw error;
  const { error: updateError } = await supabase.from('enquiries').update({ licence_path: null, id_path: null }).eq('id', request.id);
  if (updateError) throw updateError;
}

export async function updateEnquiryStatus(id, status) {
  const { error } = await supabase.from('enquiries').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteEnquiry(id) {
  const { error } = await supabase.from('enquiries').delete().eq('id', id);
  if (error) throw error;
}
