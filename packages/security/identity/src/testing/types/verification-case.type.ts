/**
 * Stackra file contract:
 * Purpose: `VerificationCase`, one recorded case for a `Verification` driver: the request, the vendor's published
 *          documentation it was recorded from, whether a sandbox run has certified it, and what the driver must answer.
 * Boundary: a type only, in the `./testing` entry. It names no vendor: the vendor drivers and their recorded vendor
 *           answers live in the OS integrations service (ADR 0443 decision 7), which builds the driver over its
 *           recorded transport and runs each case with `runVerificationCase`.
 * Runtime: isomorphic
 * Governing contract: Stackra 0357 (decision 7); ADR 0443 (decisions 7 and 8: the testing kit stays in Stackra);
 *                     ADR 0269 (decision 3); owner decision D3 (2026-10-27): certification pending until a sandbox run
 *                     passes.
 */
import type { VerificationRequest, VerificationStatus } from "#contracts/index";

/** One recorded case for a verification driver. */
export interface VerificationCase {
  /** Stable id, `<provider>.<case>` (`vendor.identity-verified`). */
  readonly id: string;

  /** The published documentation (page and section) the recorded answer comes from. */
  readonly source: string;

  /** `pending` until a run against the vendor's sandbox passes (owner decision D3). */
  readonly certification: "pending" | "certified";

  /** The check asked of the driver. */
  readonly request: VerificationRequest;

  /** What the driver must answer on the recorded exchange. */
  readonly expect: {
    /** The status; required unless `unavailable`. */
    readonly status?: VerificationStatus;
    /** The exact reason codes, in any order; only checked to be snake_case when left out. */
    readonly reasons?: readonly string[];
    /** The provider's reference for the check. */
    readonly providerReference?: string;
    /** The driver must refuse `verification_unavailable` (a vendor outage or rate limit), so the service falls through. */
    readonly unavailable?: boolean;
  };
}
