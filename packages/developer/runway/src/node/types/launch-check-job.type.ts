/**
 * Stackra file contract:
 * Purpose: `LaunchCheckJob`, the mobile launch check of one app on one platform: the runner label it needs, the
 *          Maestro flows, where the reports land, and the ordered commands that install the build and run the flows.
 * Boundary: type only; `launchCheckJob` defines it and `runLaunchCheck` runs it on a CI runner. Plain data,
 *           printable for review before it runs.
 * Runtime: node
 * Governing contract: STA-265 spec (FR-001); ADR 0352 (decision 3).
 */
import type { CaptureStep } from "#node/types/capture-step.type";

/** One app's launch check on one platform. */
export type LaunchCheckJob = {
  /** The app key. */
  readonly app: string;
  /** The platform. */
  readonly platform: "ios" | "android";
  /** The CI runner label. */
  readonly runner: string;
  /** The flows run, relative to the template checkout. */
  readonly flows: readonly string[];
  /** JUnit reports and screenshots, `<outDir>/<app>/<platform>`, relative to the repository. */
  readonly reportDir: string;
  /** The commands, in order. */
  readonly steps: readonly CaptureStep[];
};
