/**
 * Stackra file contract:
 * Purpose: `FiscalRecordStatus`, where a sealed record stands with the authority: sealed locally, handed over and
 *          waiting, accepted, or rejected.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. A record is `sealed` until a
 *           submission answers; a driver whose device or chain is the whole obligation answers `accepted` at once.
 *           Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 3); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * `FiscalService.submitPending` moves `sealed` records forward in sequence order.
 *
 * @example
 * if (record.status === FiscalRecordStatus.Rejected) notifyBackOffice(record.message);
 */
export const FiscalRecordStatus = Enum.of({
  /** Signed and chained locally; not yet handed to the authority. */
  Sealed: "sealed",
  /** Handed to an access point or ASP that delivers it later. */
  Submitted: "submitted",
  /** Accepted by the authority, or complete with no authority to tell. */
  Accepted: "accepted",
  /** Refused by the authority; `message` says why. */
  Rejected: "rejected",
});

/** One of the codes above. */
export type FiscalRecordStatus = Enum.Value<typeof FiscalRecordStatus>;
