/**
 * Stackra file contract:
 * Purpose: `LaunchCheckRequest`, what the mobile launch check is defined from: the repository, the app of the root
 *          runway's `mobile`, the platform, the simulator build to install, the template checkout holding the flows,
 *          and overrides of the launch check defaults.
 * Boundary: type only; `launchCheckJob` takes it. Every key it does not set comes from `LAUNCH_CHECK_DEFAULTS`.
 * Runtime: node
 * Governing contract: STA-265 spec (FR-001, FR-003).
 */
/** The launch check's inputs. */
export type LaunchCheckRequest = {
  /** The product repository's root folder. */
  readonly repository: string;
  /** The app key under the root runway's `mobile`; also its folder under `outDir`. */
  readonly app: string;
  /** The platform the check runs on. */
  readonly platform: "ios" | "android";
  /** The Release simulator build: the `.app` on iOS, the `.apk` on Android (the `simulator` EAS profile). */
  readonly appPath: string;
  /** The template line checkout the flows are read from. */
  readonly templateDir: string;
  /** Maestro flows, relative to `templateDir`. */
  readonly flows?: readonly string[];
  /** The CI runner label. */
  readonly runner?: string;
  /** The iOS simulator (name or UDID). */
  readonly device?: string;
  /** Reports and screenshots folder, relative to the repository. */
  readonly outDir?: string;
};
