// Browser storage is optional (private mode, denied access, quota exhaustion).
const volatile = new Map();
export const storage = {
  getItem(key) {
    if (volatile.has(key)) return volatile.get(key);
    try { return localStorage.getItem(key); }
    catch { return null; }
  },
  setItem(key, value) {
    volatile.set(key, String(value));
    try { localStorage.setItem(key, String(value)); } catch { /* Session-only fallback. */ }
  },
  removeItem(key) {
    volatile.set(key, null);
    try { localStorage.removeItem(key); } catch { /* Storage unavailable. */ }
  },
};
export function readJson(key, fallback = null) {
  try { return JSON.parse(storage.getItem(key)) ?? fallback; }
  catch { storage.removeItem(key); return fallback; }
}
