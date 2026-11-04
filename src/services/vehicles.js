import { isSupabaseConfigured, rest } from '../lib/backend';
import { demoVehicles } from '../data/demoVehicles';

// Stale-while-revalidate inventory: pages render instantly from the last known
// list (memory, then localStorage) while a fresh copy is fetched in the background.
const KEY = 'titan-vehicles-v2';
const FRESH_MS = 15000;

let list = null;
let fetchedAt = 0;
let inFlight = null;

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function peekVehicles() {
  if (!isSupabaseConfigured) return demoVehicles;
  if (!list) list = readStored();
  return list;
}

export function refreshVehicles({ force = false } = {}) {
  if (!isSupabaseConfigured) return Promise.resolve(demoVehicles);
  if (inFlight) return inFlight;
  if (!force && list && Date.now() - fetchedAt < FRESH_MS) return Promise.resolve(list);
  inFlight = rest('vehicles?select=*&order=created_at.desc')
    .then((data) => {
      list = data;
      fetchedAt = Date.now();
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage full or blocked */ }
      return data;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

// Called after admin edits so this browser doesn't show the old copy.
export function invalidateVehicles() {
  list = null;
  fetchedAt = 0;
  try { localStorage.removeItem(KEY); } catch { /* storage blocked */ }
}
