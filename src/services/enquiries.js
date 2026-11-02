import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const ENQUIRY_STATUSES = ['new', 'contacted', 'resolved'];

export async function submitEnquiry(values) {
  if (!isSupabaseConfigured) {
    throw new Error('NOT_CONFIGURED');
  }
  // No .select() here: the public role may insert but cannot read enquiries back.
  const { error } = await supabase.from('enquiries').insert({
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    vehicle_interest: values.vehicle_interest.trim() || null,
    vehicle_id: values.vehicle_id || null,
    message: values.message.trim(),
  });
  if (error) throw error;
}

export async function listEnquiries({ limit } = {}) {
  let q = supabase.from('enquiries').select('*').order('created_at', { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
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
