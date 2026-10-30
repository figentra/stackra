/**
 * Stackra file contract:
 * Purpose: `readStored`, one value from the browser's local storage, for a component that remembers its layout (the
 *          Sidebar's collapsed state and width, the SidePanel's state and width).
 * Boundary: never throws: no key, no window, a blocked or private storage all read as undefined.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371).
 */

/**
 * The stored value under `key`.
 * @param key - the storage key, or undefined for a component that stores nothing
 * @returns the value, or undefined when there is none or storage is unavailable
 */
export function readStored(key: string | undefined): string | undefined {
  if (key === undefined || typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}
