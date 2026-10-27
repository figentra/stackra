/**
 * Stackra file contract:
 * Purpose: `ScreenshotCaptureRequest`, what the store-screenshot capture job is defined from: the repository, the app
 *          of the root runway's `mobile`, the simulator build to install, and overrides of the capture defaults.
 * Boundary: type only; `screenshotCaptureJob` takes it. Every key it does not set comes from
 *           `SCREENSHOT_CAPTURE_DEFAULTS`.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: D19, decision 7).
 */
/** The capture job's inputs. */
export type ScreenshotCaptureRequest = {
  /** The product repository's root folder. */
  readonly repository: string;
  /** The app key under the root runway's `mobile`; also its folder under `storeDir` and `outDir`. */
  readonly app: string;
  /** The simulator build of the app (`.app`), built with demo data on (an EAS simulator profile). */
  readonly appPath: string;
  /** The CI runner label. */
  readonly runner?: string;
  /** The simulator (name or UDID). */
  readonly device?: string;
  /** Captions folder, relative to the repository. */
  readonly storeDir?: string;
  /** Screenshots folder, relative to the repository. */
  readonly outDir?: string;
  /** The demo-data link template. */
  readonly demoLink?: string;
  /** The per-screen link template. */
  readonly screenLink?: string;
  /** Milliseconds a launch or a link settles. */
  readonly settleMs?: number;
};
