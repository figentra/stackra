/**
 * Stackra file contract:
 * Purpose: `stackraVersion`, the middleware that pins every call to one dated API version with the `Stackra-Version`
 *          header (gen passes the newest date of the producer's versioning config).
 * Boundary: checks the date once, when the middleware is built; a header already on the request wins. Paths never
 *           carry a version.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (API versions are dates in `Stackra-Version`).
 */
import { TRANSPORT_HEADERS } from "#core/constants/transport-headers.constant";
import { withHeader } from "#core/functions/with-header.function";
import type { Middleware } from "#core/types/middleware.type";

/** `YYYY-MM-DD`. */
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Whether `text` is `YYYY-MM-DD` and names a real day: the round trip refuses `2027-02-30`, which the pattern takes. */
function isCalendarDate(text: string): boolean {
  if (!CALENDAR_DATE.test(text)) return false;
  const time = Date.parse(`${text}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === text;
}

/**
 * Sends `Stackra-Version: <version>`.
 *
 * @example
 * createTransport({ middleware: [stackraVersion("2027-03-01")] });
 * @throws RangeError when `version` is not a calendar date (`YYYY-MM-DD`).
 */
export function stackraVersion(version: string): Middleware {
  if (!isCalendarDate(version))
    throw new RangeError(`Stackra-Version must be a calendar date (YYYY-MM-DD), got "${version}"`);
  return (request, next) => next(withHeader(request, TRANSPORT_HEADERS.stackraVersion, version));
}
