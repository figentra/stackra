/**
 * Stackra file contract:
 * Purpose: `SubmissionOutcome`, what `FiscalDriver.submit` answers: the new status, the authority's reference and
 *          message, and the payload the authority returned (a cleared invoice).
 * Boundary: a type only. A transport failure is not an outcome: the driver throws `FiscalAuthorityUnavailableError`
 *           and the record stays `sealed` for the next attempt.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 3).
 */
import type { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";

/** The authority's answer to one submission. */
export type SubmissionOutcome = {
  /** `accepted`, `rejected` or `submitted` (delivery pending at an access point). */
  readonly status: FiscalRecordStatus;
  /** The authority's id for the document. */
  readonly authorityReference: string | null;
  /** Warnings or the rejection reason. */
  readonly message: string | null;
  /** A replacement payload the authority returned (a cleared, stamped invoice); `null` to keep the sealed one. */
  readonly payload: string | null;
};
