/**
 * Stackra file contract:
 * Purpose: `CertificationResult`, one run of one certification case: the sealed output, every missed expectation
 *          and the authority's verdict when the run submitted.
 * Boundary: a type only, in the `./testing` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1 to 4); ADR 0269 (fixtures in the owning package's `./testing`);
 *                     owner decision D3 (2026-10-27): certification pending until a sandbox run passes.
 */
import type { SealedPayload } from "#contracts/types/sealed-payload.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";

/** One run of one case. */
export type CertificationResult = {
  /** The case id. */
  readonly caseId: string;
  /** What the driver sealed. */
  readonly sealed: SealedPayload;
  /** Every expectation the sealed output missed; empty on a pass. */
  readonly mismatches: readonly string[];
  /** The authority's verdict, when the run submitted; `null` otherwise. */
  readonly outcome: SubmissionOutcome | null;
};
