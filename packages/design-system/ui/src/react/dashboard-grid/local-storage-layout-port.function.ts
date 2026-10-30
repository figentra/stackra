/**
 * Stackra file contract:
 * Purpose: `localStorageLayoutPort`, a `DashboardLayoutPort` that keeps one reader's layout in this browser's
 *          `localStorage` under a key: for a prototype, a kiosk or a dashboard with no user settings yet.
 * Boundary: browser only. Storage can be missing or refuse access (private windows, blocked site data), so every read
 *           and write is guarded: a read that fails loads nothing, a write that fails is dropped. What it loads is
 *           checked by `useDashboardLayout` (`reconcileDashboardLayout`), not here.
 * Runtime: browser
 * Governing contract: ADR 0307 (decisions 16 and 18); STA-1371.
 */
import type { DashboardLayout } from "#contracts/types/dashboard-layout.type";
import type { DashboardLayoutPort } from "#contracts/types/dashboard-layout-port.type";

/**
 * A layout port over `localStorage`.
 * @param key - the storage key, such as "sales-dashboard-layout"
 * @returns the port to pass to `DashboardGrid`'s `layoutPort`
 */
export function localStorageLayoutPort(key: string): DashboardLayoutPort {
  return {
    load: async () => {
      try {
        const text = globalThis.localStorage?.getItem(key);
        return text ? (JSON.parse(text) as DashboardLayout) : null;
      } catch {
        return null;
      }
    },
    save: async (layout) => {
      try {
        globalThis.localStorage?.setItem(key, JSON.stringify(layout));
      } catch {
        // Storage full or blocked: the layout stays on screen for this visit.
      }
    },
  };
}
