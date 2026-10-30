/**
 * Stackra file contract:
 * Purpose: `SmokeResult`, what one smoke check found: the subject it checked, whether it passed, the problems seen and
 *          where its evidence (screenshot, report) was left.
 * Boundary: type only; a `SmokeDriver` answers it and `RunwaySmokeFailedError` carries every one when any failed.
 * Runtime: isomorphic
 * Governing contract: STA-265 spec (D6, FR-008).
 */

/** One smoke check's outcome. */
export type SmokeResult = {
  /** The subject's target. */
  readonly target: "web" | "mobile" | "desktop";
  /** The subject's name (surface or app key, with the platform for mobile). */
  readonly name: string;
  /** Whether the subject passed. */
  readonly passed: boolean;
  /** What failed, one line each; empty when it passed. */
  readonly problems: readonly string[];
  /** The evidence's path, relative to the repository. */
  readonly evidence?: string;
};
