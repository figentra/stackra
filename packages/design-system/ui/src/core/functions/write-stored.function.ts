/**
 * Stackra file contract:
 * Purpose: `writeStored`, keeps one value in the browser's local storage, for a component that remembers its layout.
 * Boundary: never throws: a storage that refuses (a private window, a full quota) is ignored, because remembering is a
 *           convenience and the state still works for this visit.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371).
 */

/**
 * Stores `value` under `key`.
 * @param key - the storage key, or undefined for a component that stores nothing
 * @param value - the value to keep
 */
export function writeStored(key: string | undefined, value: string): void {
  if (key === undefined || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage is a convenience: the state still works for this visit.
  }
}
