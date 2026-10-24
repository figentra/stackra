/**
 * Stackra file contract:
 * Purpose: `MixedCurrencyError`, the refusal of a money sum over rows in more than one currency: adding minor units of
 *          different currencies gives a meaningless number.
 * Boundary: a refusal (`failed_precondition`); `field` names the summed money path (`total.minor`). A business that
 *           sells in several currencies reports in a reporting currency snapshotted at checkout.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 16: money KPIs never mix currencies); ADR 0140 (refusals).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The rows of a money sum are in more than one currency. */
export class MixedCurrencyError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The summed money path, such as `total.minor`. */
  field!: string;
}
