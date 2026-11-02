import { useEffect } from 'react';
import { useAsync } from './useAsync';
import { getVehicle, listVehicles } from '../services/vehicles';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Live inventory: refetches when the vehicles table changes (if Realtime is enabled).
function useRealtimeReload(reload) {
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    const channel = supabase
      .channel(`vehicles-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [reload]);
}

export function useVehicles(options = {}) {
  const result = useAsync(() => listVehicles(options), [options.featuredOnly]);
  useRealtimeReload(result.reload);
  return result;
}

export function useVehicle(id) {
  return useAsync(() => getVehicle(id), [id]);
}
