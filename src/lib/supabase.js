import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, SUPABASE_URL, SUPABASE_KEY } from './backend';

// Admin only. Only the public key is used in the browser; all write access is
// enforced server-side by Row Level Security (see supabase/schema.sql).
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

export { isSupabaseConfigured };
export const VEHICLE_BUCKET = 'vehicle-images';
