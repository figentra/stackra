/**
 * Stackra file contract:
 * Purpose: `RouteReload`, what `useRouteReload()` returns: run the screen's loader again (pull to refresh) and whether
 *          it is running.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 16).
 */

/** The screen's reload. */
export interface RouteReload {
  /** Runs the loader again; the page keeps its data until the new data arrives. */
  readonly run: () => Promise<void>;

  /** True while a reload runs. */
  readonly isRunning: boolean;
}
