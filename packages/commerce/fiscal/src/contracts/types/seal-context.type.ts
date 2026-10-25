/**
 * Stackra file contract:
 * Purpose: `SealContext`, what `FiscalDriver.seal` gets besides the document: the unit, the options, the record before
 *          it on the chain, the sequence it will take, and the time.
 * Boundary: a type only; built by `FiscalService`. The clock is read once by the service, so a driver never reads the
 *           time itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 3).
 */
import type { DriverContext } from "#contracts/types/driver-context.type";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";

/** The chain position of a document about to be sealed. */
export type SealContext = DriverContext & {
  /** The unit's last record; `null` for the first document. */
  readonly previous: FiscalRecord | null;
  /** The sequence the new record takes. */
  readonly sequence: number;
  /** The sealing time. */
  readonly now: Date;
};
