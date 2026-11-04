import { supabase } from '../lib/supabase';

export const ENQUIRY_STATUSES = ['new', 'contacted', 'resolved'];

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

export async function listRentals() {
  const { data, error } = await supabase.from('enquiries').select('*').eq('type', 'rental').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateEnquiryStatus(id, status) {
  const { error } = await supabase.from('enquiries').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteEnquiry(id) {
  const { error } = await supabase.from('enquiries').delete().eq('id', id);
  if (error) throw error;
}
