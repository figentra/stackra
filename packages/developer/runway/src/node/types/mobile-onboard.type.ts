/**
 * Stackra file contract:
 * Purpose: `MobileOnboard`, the outcome of one onboarding run: the app, its store ids, every step in order, and
 *          the files it wrote (`runway.yaml`, the Firebase config files).
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0482 (decision 1).
 */
import type { MobileIds } from "#core/types/mobile-ids.type";
import type { OnboardStep } from "#node/types/onboard-step.type";

/** One onboarding run's outcome. */
export type MobileOnboard = {
  /** The app key. */
  readonly app: string;
  /** Its store ids. */
  readonly ids: MobileIds;
  /** Every step, in order. */
  readonly steps: readonly OnboardStep[];
  /** The files written, relative to the repository (none on a dry run). */
  readonly written: readonly string[];
};
