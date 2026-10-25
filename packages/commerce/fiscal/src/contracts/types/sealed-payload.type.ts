/**
 * Stackra file contract:
 * Purpose: `SealedPayload`, what a driver returns from `seal`: the payload, its chain hash, signature, QR text, marks
 *          and the status the record starts in.
 * Boundary: a type only; `FiscalService` adds the chain fields and stores the `FiscalRecord`.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 3).
 */
import type { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";

/** A driver's sealed output. */
export type SealedPayload = {
  /** What the authority receives, as text. */
  readonly payload: string;
  /** Media type of `payload`. */
  readonly contentType: string;
  /** This record's chain hash. */
  readonly hash: string;
  /** The signature or seal, when the driver signs. */
  readonly signature: string | null;
  /** The receipt QR text, when the format has one. */
  readonly qr: string | null;
  /** Marks a receipt prints. */
  readonly marks: Readonly<Record<string, string>>;
  /** `sealed` when a submission must follow, `accepted` when sealing completes the obligation. */
  readonly status: FiscalRecordStatus;
};
