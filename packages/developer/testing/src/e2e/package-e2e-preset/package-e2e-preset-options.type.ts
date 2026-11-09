/**
 * Stackra file contract:
 * Purpose: `PackageE2ePresetOptions`, what gen's `playwright.e2e.config.ts` passes `packageE2ePreset`: the package
 *          root and name, the port of the page server and the opt-in browsers.
 * Boundary: a type only; every value comes from gen, never typed by hand.
 * Runtime: node
 * Governing contract: ADR 0022 (the 2026-11-09 amendment: package e2e); ADR 0295 (decision 5).
 */

/** The options of a package's e2e config. */
export interface PackageE2ePresetOptions {
  /** The package root: the test directory, and where the page server starts. */
  readonly root: string;

  /** The package name (`@stackra/ui`). */
  readonly package: string;

  /** The port of the page server; 5199 when left out. */
  readonly port?: number;

  /** Browsers to run besides Chromium (`chromium-ar` always runs); none when left out. */
  readonly browsers?: readonly ("firefox" | "webkit")[];
}
