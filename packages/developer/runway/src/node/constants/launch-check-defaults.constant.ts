/**
 * Stackra file contract:
 * Purpose: `LAUNCH_CHECK_DEFAULTS`, the defaults of the mobile launch check: the CI runner per platform (the capture
 *          job's Mac runner for iOS, a Linux runner with KVM for the Android emulator), the simulator, the Maestro
 *          flows run from the template checkout, and where the reports and screenshots are left.
 * Boundary: data only; a `LaunchCheckRequest` overrides any key. The iOS runner and simulator are the capture job's
 *           (`SCREENSHOT_CAPTURE_DEFAULTS`), so both run on one runner from one simulator build.
 * Runtime: node
 * Governing contract: STA-265 spec (FR-003, D1, D2); ADR 0441 (as amended: D19).
 */
import { SCREENSHOT_CAPTURE_DEFAULTS } from "#node/constants/screenshot-capture-defaults.constant";

/** Launch check defaults. */
export const LAUNCH_CHECK_DEFAULTS = Object.freeze({
  /** The CI runner label per platform. */
  runners: Object.freeze({ ios: SCREENSHOT_CAPTURE_DEFAULTS.runner, android: "ubuntu-latest" }),
  /** The iOS simulator (name or UDID); the Android emulator is the one the workflow started. */
  device: SCREENSHOT_CAPTURE_DEFAULTS.device,
  /** Maestro flows, relative to the template checkout; os/mobile@3 ships the launch flow. */
  flows: Object.freeze([".maestro/launch.yaml"]),
  /** Reports and screenshots, `<outDir>/<app>/<platform>/`; never committed. */
  outDir: ".stackra/launch-check",
} as const);
