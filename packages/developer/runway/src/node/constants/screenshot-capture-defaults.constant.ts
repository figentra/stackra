/**
 * Stackra file contract:
 * Purpose: `SCREENSHOT_CAPTURE_DEFAULTS`, the defaults of the store-screenshot capture job: the CI runner label (a Mac
 *          runner, never a developer's Mac), the simulator, where captions are read and screenshots left, the deep
 *          links that load the demo data and open a screen, and how long a screen settles before its capture.
 * Boundary: data only; a `ScreenshotCaptureRequest` overrides any key. `outDir` and `storeDir` match
 *           @stackra/brand-kit's `screenshotsDir` and `storeDir` defaults, so the kit's store frames find the
 *           captures. Link templates take `{scheme}`, `{screen}` and `{locale}`; the app's template line handles them.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: D19, decision 7); app-shells section 14 (simulator lane on a Mac runner).
 */

/** Capture job defaults. */
export const SCREENSHOT_CAPTURE_DEFAULTS = Object.freeze({
  /** The CI runner label the job runs on. */
  runner: "macos",
  /** The iOS simulator (name or UDID); the 6.9-inch display App Store Connect asks for first. */
  device: "iPhone 16 Pro Max",
  /** Captions folder, `<storeDir>/<app>/<locale>/captions.json`. */
  storeDir: "assets/store",
  /** Screenshots folder, `<outDir>/<app>/<locale>/<screen>.png`; never committed. */
  outDir: ".stackra/screenshots",
  /** Opened after each launch: signs into the demo scope and loads its demo data. */
  demoLink: "{scheme}://demo?locale={locale}",
  /** Opened per screen before its capture. */
  screenLink: "{scheme}://store-screenshot/{screen}",
  /** Milliseconds a launch or a link settles before the next step. */
  settleMs: 3000,
} as const);
