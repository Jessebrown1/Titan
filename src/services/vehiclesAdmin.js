import { supabase, isSupabaseConfigured, VEHICLE_BUCKET } from '../lib/supabase';
import { invalidateVehicles } from './vehicles';
import { compressImage } from '../lib/image';

const TABLE = 'vehicles';

const requireBackend = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
  }
};

export async function listVehicles() {
  requireBackend();
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getVehicle(id) {
  requireBackend();
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) {
    // Malformed UUIDs from hand-typed URLs are simply "not found".
    if (error.code === '22P02') return null;
    throw error;
  }
  return data;
}

const FIELDS = [
  'make', 'model', 'year', 'price', 'mileage', 'transmission', 'fuel_type', 'engine',
  'colour', 'description', 'main_image', 'images', 'status', 'featured',
  'for_sale', 'for_rent', 'rent_per_day',
];
const pick = (v) => Object.fromEntries(FIELDS.filter((k) => k in v).map((k) => [k, v[k]]));

export async function createVehicle(values) {
  requireBackend();
  const { data, error } = await supabase.from(TABLE).insert(pick(values)).select().single();
  if (error) throw error;
  invalidateVehicles();
  return data;
}

export async function updateVehicle(id, values) {
  requireBackend();
  const { data, error } = await supabase.from(TABLE).update(pick(values)).eq('id', id).select().single();
  if (error) throw error;
  invalidateVehicles();
  return data;
}

export async function deleteVehicle(vehicle) {
  requireBackend();
  const { error } = await supabase.from(TABLE).delete().eq('id', vehicle.id);
  if (error) throw error;
  invalidateVehicles();
  // Best-effort clean-up of photos stored in our bucket.
  const paths = [vehicle.main_image, ...(vehicle.images || [])]
    .map(storagePathFromUrl)
    .filter(Boolean);
  if (paths.length) await supabase.storage.from(VEHICLE_BUCKET).remove(paths);
}

export async function uploadVehicleImage(file) {
  requireBackend();
  const compressed = await compressImage(file);
  const ext = compressed.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `vehicles/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(VEHICLE_BUCKET)
    .upload(path, compressed, { cacheControl: '31536000', contentType: compressed.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from(VEHICLE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removeVehicleImage(url) {
  const path = storagePathFromUrl(url);
  if (!path || !isSupabaseConfigured) return;
  await supabase.storage.from(VEHICLE_BUCKET).remove([path]);
}

function storagePathFromUrl(url) {
  const marker = `/storage/v1/object/public/${VEHICLE_BUCKET}/`;
  if (!url || !url.includes(marker)) return null;
  return decodeURIComponent(url.split(marker)[1].split('?')[0]);
}
