/**
 * Stackra file contract:
 * Purpose: `InvalidTimeZoneError`, the refusal of a schedule's time zone that the runtime does not know
 *          (`invalid_time_zone`).
 * Boundary: kind `Validation` (HTTP 400), not retryable; its details name the time zone as given. A time zone is an
 *           IANA name (`Asia/Dubai`) or `UTC`.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0148 (decision 5: each schedule runs in its scope's time
 *                     zone); final review R-02 (typed `create`); ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The time zone is not one the runtime knows.
 *
 * @example
 * throw InvalidTimeZoneError.create({ timeZone: "Mars/Olympus" });
 */
export class InvalidTimeZoneError extends Refusal({ kind: ErrorKind.Validation }) {
  /** The time zone as given. */
  timeZone!: string;
}
