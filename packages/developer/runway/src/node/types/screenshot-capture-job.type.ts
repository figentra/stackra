/**
 * Stackra file contract:
 * Purpose: `ScreenshotCaptureJob`, the store-screenshot capture job for one app: the runner label it needs, the
 *          simulator, each locale with its screens, where the PNGs land, and the ordered commands that capture them.
 * Boundary: type only; `screenshotCaptureJob` defines it and `runScreenshotCapture` runs it on the Mac runner. Plain
 *           data, printable for review before it runs.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: D19, decision 7); ADR 0352 (decision 3).
 */
import type { CaptureStep } from "#node/types/capture-step.type";

/** One app's capture job. */
export type ScreenshotCaptureJob = {
  /** The app key. */
  readonly app: string;
  /** The CI runner label (a Mac runner). */
  readonly runner: string;
  /** The simulator. */
  readonly device: string;
  /** Screens per locale, from `<storeDir>/<app>/<locale>/captions.json`. */
  readonly locales: readonly { readonly locale: string; readonly screens: readonly string[] }[];
  /** The screenshots folder, relative to the repository; brand-kit's `screenshotsDir`. */
  readonly outDir: string;
  /** The commands, in order. */
  readonly steps: readonly CaptureStep[];
};
