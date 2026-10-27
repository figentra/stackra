/**
 * Stackra file contract:
 * Purpose: `AppPresetOptions`, the options of `appPreset`.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0022 (test placement); ADR 0295 (decision 5: generated tool
 *                     configs).
 */
/** Options of `appPreset`. */
export interface AppPresetOptions {
  /** The app root (the folder above `.stackra/`). */
  root: string;
  /** Source folders whose tests run in the node environment (Electron main, server code). */
  nodeFolders?: string[];
  /** Extra globs no project runs, for example the Playwright `*.e2e.test.ts` files. */
  exclude?: string[];
}
