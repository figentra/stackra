/**
 * Stackra file contract:
 * Purpose: `ForecastUnavailableError`, the failure of a forecast the engine could not answer: the driver is not
 *          configured, its token name is not bound, the service is unreachable, answered an error status or a shape
 *          the driver does not read.
 * Boundary: a refusal (`unavailable`, retryable); `driver` names the driver and `reason` what failed. It never carries
 *           the token, a series or the service's response body.
 * Runtime: node
 * Governing contract: ADR 0492 (decision 8); ADR 0140 (refusals); ADR 0173.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The forecast engine could not answer. */
export class ForecastUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** The driver name, such as `http`. */
  driver!: string;

  /** What failed, such as `the forecast service answered 503`. */
  reason!: string;
}
