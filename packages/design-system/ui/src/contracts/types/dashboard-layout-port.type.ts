/**
 * Stackra file contract:
 * Purpose: `DashboardLayoutPort`, where a `DashboardGrid` keeps the reader's layout: the app's adapter loads the saved
 *          layout (a user setting, a server row, browser storage) and saves each change.
 * Boundary: types only. The grid never knows where the layout lives; a failed load keeps the default layout.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decisions 16 and 18: the caller owns the data); ADR 0305 (one declaration per file);
 *          STA-1371.
 */
import type { DashboardLayout } from "#contracts/types/dashboard-layout.type";

/** Loads and saves a dashboard's layout. */
export interface DashboardLayoutPort {
  /** The saved layout, or null when there is none yet. */
  readonly load: () => Promise<DashboardLayout | null>;
  /** Keeps `layout` as the reader's layout. */
  readonly save: (layout: DashboardLayout) => Promise<void>;
}
