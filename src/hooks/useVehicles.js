import { useCallback, useEffect, useState } from 'react';
import { peekVehicles, refreshVehicles } from '../services/vehicles';

// Renders from cache immediately, then refreshes in the background and on tab focus.
export function useVehicles() {
  const [data, setData] = useState(peekVehicles);
  const [loading, setLoading] = useState(() => !peekVehicles());
  const [error, setError] = useState(null);

  const reload = useCallback(async (options) => {
    try {
      const fresh = await refreshVehicles(options);
      setData(fresh);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const onFocus = () => reload();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reload]);

  // Cached cars stay on screen if a background refresh fails.
  return { data, loading, error: data ? null : error, reload: () => reload({ force: true }) };
}

export function useVehicle(id) {
  const { data, loading, error, reload } = useVehicles();
  return { data: data?.find((v) => v.id === id) ?? null, all: data, loading, error, reload };
}
