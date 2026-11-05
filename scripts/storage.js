// Browser storage is optional (private mode, denied access, quota exhaustion).
const volatile = new Map();
export const storage = {
  getItem(key) {
    try { return localStorage.getItem(key) ?? volatile.get(key) ?? null; }
    catch { return volatile.get(key) ?? null; }
  },
  setItem(key, value) {
    volatile.set(key, String(value));
    try { localStorage.setItem(key, String(value)); } catch { /* Session-only fallback. */ }
  },
  removeItem(key) {
    volatile.delete(key);
    try { localStorage.removeItem(key); } catch { /* Storage unavailable. */ }
  },
};
export function readJson(key, fallback = null) {
  try { return JSON.parse(storage.getItem(key)) ?? fallback; }
  catch { storage.removeItem(key); return fallback; }
}
