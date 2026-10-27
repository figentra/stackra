/**
 * Stackra file contract:
 * Purpose: `FiscalDriverMissingError`, the refusal when a market pack names a fiscal driver no registered driver has
 *          the key of.
 * Boundary: a refusal (`FailedPrecondition`); code derived from the class name; the fields carry keys and numbers only,
 *           never a
 *           document's content or personal data.
 * Runtime: isomorphic
 * Governing contract: ADR 0364; ADR 0294 (decisions 16 and 20); ADR 0140 (envelope and kinds); ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable until the host registers the driver or the pack changes.
 *
 * @example
 * throw FiscalDriverMissingError.create({ market: "sa", channel: "till", driver: "zatca" });
 */
export class FiscalDriverMissingError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The market-pack code. */
  market!: string;

  /** The channel the pack was read for. */
  channel!: string;

  /** The driver key the pack names. */
  driver!: string;
}
