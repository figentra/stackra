/**
 * Stackra file contract:
 * Purpose: `E2eProject`, one Playwright project as `e2ePreset` takes it when a runner name is not enough: an RTL locale
 *          over a runner, the `pwa` project with service workers on, or the `desktop` project of Electron journeys.
 * Boundary: a type only. A project with `match` owns those files; every project without one skips them.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 6); ADR 0182 (the e2e tier); ADR 0080 (both locales).
 */

/** One e2e project. */
export interface E2eProject {
  /** The project name (`chromium-rtl`). */
  readonly name: string;

  /** The runner it copies (`chromium`, `mobile-safari`); its own name, or Chromium for a `pwa` project, when left out. */
  readonly base?: string;

  /** The browser locale (`ar`, `ar-SA`). */
  readonly locale?: string;

  /** `pwa` runs in Chromium against the service worker; `desktop` journeys launch Electron with `launchDesktop`. */
  readonly target?: "pwa" | "desktop";

  /** Whether pages may register service workers; `block` when left out. */
  readonly serviceWorkers?: "allow" | "block";

  /** The test files this project owns (`/\.offline\.e2e\.test\.ts$/`); every `.e2e.test.ts` when left out. */
  readonly match?: RegExp;
}
